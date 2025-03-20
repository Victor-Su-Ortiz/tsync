import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { SOCKET_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the socket context structure
type SocketContextType = {
  socket: Socket | null;
  notificationCount: number;
  incrementNotificationCount: () => void;
  resetNotificationCount: () => void;
  updateNotificationCount: (count: number) => void;
};

// Create the context
const SocketContext = createContext<SocketContextType>({
  socket: null,
  notificationCount: 0,
  incrementNotificationCount: () => { },
  resetNotificationCount: () => { },
  updateNotificationCount: () => { },
});

// Create the provider component
export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const { authToken, userInfo } = useAuth();

  // Load saved notification count on initial render
  useEffect(() => {
    const loadNotificationCount = async () => {
      try {
        const savedCount = await AsyncStorage.getItem('notificationCount');
        if (savedCount !== null) {
          setNotificationCount(parseInt(savedCount, 10));
        }
      } catch (error) {
        console.error('Error loading notification count:', error);
      }
    };

    loadNotificationCount();
  }, []);

  // Save notification count whenever it changes
  useEffect(() => {
    const saveNotificationCount = async () => {
      try {
        await AsyncStorage.setItem('notificationCount', notificationCount.toString());
      } catch (error) {
        console.error('Error saving notification count:', error);
      }
    };

    saveNotificationCount();
  }, [notificationCount]);

  const incrementNotificationCount = () => {
    console.log('Incrementing notification count');
    setNotificationCount(prev => prev + 1);
  };

  const resetNotificationCount = () => {
    console.log('Resetting notification count');
    setNotificationCount(0);
  };

  const updateNotificationCount = (count: number) => {
    console.log('Updating notification count to:', count);
    setNotificationCount(count);
  };

  useEffect(() => {
    if (!authToken) {
      console.log('No auth token available for socket connection');
      return;
    }

    // Extract userId from userInfo if available
    const userId = userInfo?.id;

    if (!userId) {
      console.log('No user ID available for socket connection');
      return;
    }

    // Get your backend URL from environment or use direct URL
    console.log('Connecting to socket server:', SOCKET_URL);

    // Initialize socket connection with error handling
    try {
      const newSocket = io(SOCKET_URL, {
        auth: {
          token: authToken
        },
        autoConnect: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Socket connected successfully', newSocket.id);
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        console.error('Error details:', JSON.stringify(err));
      });

      // Listen for generic notification events
      newSocket.on('notification', (data) => {
        console.log('Received notification event:', data);
        incrementNotificationCount();
      });

      // Listen for friend request specific events
      newSocket.on('friend_request', (data) => {
        console.log('Received friend request event:', data);
        incrementNotificationCount();
      });

      // Listen for the user-specific channel
      newSocket.on(`user:${userId}`, (data) => {
        console.log(`Received event on user_${userId}:`, data);
        incrementNotificationCount();
      });

      // Clean up on unmount
      return () => {
        console.log('Disconnecting socket');
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    } catch (error: any) {
      console.error('Error setting up socket:', error);
    }
  }, [authToken, userInfo?.id]);

  return (
    <SocketContext.Provider value={{
      socket,
      notificationCount,
      incrementNotificationCount,
      resetNotificationCount,
      updateNotificationCount
    }}>
      {children}
    </SocketContext.Provider>
  );
};

// Create a hook to use the socket context
export const useSocket = () => useContext(SocketContext);