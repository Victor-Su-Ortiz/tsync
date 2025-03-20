// src/context/SocketContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { Alert } from 'react-native'; // For debugging
import { SOCKET_URL } from '@env';

// Define the socket context structure
type SocketContextType = {
  socket: Socket | null;
  notificationCount: number;
  incrementNotificationCount: () => void;
  resetNotificationCount: () => void;
};

// Create the context
const SocketContext = createContext<SocketContextType>({
  socket: null,
  notificationCount: 0,
  incrementNotificationCount: () => { },
  resetNotificationCount: () => { },
});

// Create the provider component
export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const { authToken, userInfo } = useAuth();

  const incrementNotificationCount = () => setNotificationCount(prev => prev + 1);
  const resetNotificationCount = () => setNotificationCount(0);

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
    // Don't include any path or namespace - connect to the root
    console.log('Connecting to socket server:', SOCKET_URL);

    // Initialize socket connection with error handling
    try {
      // Important: Do NOT include a namespace in the URL (no '/socket.io' or similar)
      console.log('Setting up socket connection with token:', authToken);
      const newSocket = io(SOCKET_URL, {
        auth: {
          token: authToken
        },
        autoConnect: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        // Try both transport methods - important for mobile
        transports: ['websocket', 'polling'],
        // Add timeout and other options
        timeout: 10000,
        forceNew: true
      });

      setSocket(newSocket);

      newSocket.on('connection', () => {
        console.log('Socket connected successfully', newSocket.id);
        Alert.alert('Debug', 'Socket connected successfully');
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        console.error('Error details:', JSON.stringify(err));
        Alert.alert('Socket Error', `Connection error: ${err.message}`);
      });

      // Listen for generic notification events
      newSocket.on('notification', (data) => {
        console.log('Received notification event:', data);
        incrementNotificationCount();
        Alert.alert('Notification Received', JSON.stringify(data));
      });

      // Listen for friend request specific events
      newSocket.on('friend_request', (data) => {
        console.log('Received friend request event:', data);
        incrementNotificationCount();
        Alert.alert('Friend Request', `Request from: ${data?.from?.name || 'Someone'}`);
      });

      // Listen for the user-specific channel
      // This is how the server will likely emit events for a specific user
      newSocket.on(`user:${userId}`, (data) => {
        console.log(`Received event on user_${userId}:`, data);
        incrementNotificationCount();
        Alert.alert('User Event', `New notification for user ${userId}`);
      });

      // Force an immediate test notification for debugging (remove in production)
      // setTimeout(() => {
      //   console.log('Triggering test notification');
      //   incrementNotificationCount();
      // }, 5000);

      // Clean up on unmount
      return () => {
        console.log('Disconnecting socket');
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    } catch (error: any) {
      console.error('Error setting up socket:', error);
      Alert.alert('Socket Setup Error', error.message);
    }
  }, [authToken, userInfo?.id]);

  return (
    <SocketContext.Provider value={{
      socket,
      notificationCount,
      incrementNotificationCount,
      resetNotificationCount
    }}>
      {children}
    </SocketContext.Provider>
  );
};

// Create a hook to use the socket context
export const useSocket = () => useContext(SocketContext);