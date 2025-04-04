// src/context/SocketContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { Alert } from 'react-native';
import { SOCKET_URL } from '@env';

// Define the socket context structure
type SocketContextType = {
  socket: Socket | null;
  notificationCount: number;
  incrementNotificationCount: () => void;
  resetNotificationCount: () => void;
  updateNotificationCount: (number: number) => void;
};

// Create the context
const SocketContext = createContext<SocketContextType>({
  socket: null,
  notificationCount: 0,
  incrementNotificationCount: () => { },
  resetNotificationCount: () => { },
  updateNotificationCount: (number: number) => { },
});

// Create the provider component
export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const { authToken, userInfo } = useAuth();

  const incrementNotificationCount = () => setNotificationCount(prev => prev + 1);
  const resetNotificationCount = () => setNotificationCount(0);
  const updateNotificationCount = (value: number) => setNotificationCount(value);

  // Use this ref to track if the effect has already run
  const socketInitialized = React.useRef(false);

  useEffect(() => {
    if (!authToken || !userInfo?.id || socketInitialized.current) {
      return;
    }

    const userId = userInfo.id;
    console.log('Connecting to socket server:', SOCKET_URL);
    console.log('User ID for socket connection:', userId);

    try {
      const newSocket = io(SOCKET_URL, {
        auth: { token: authToken },
        autoConnect: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
      });

      // Mark socket as initialized
      socketInitialized.current = true;
      setSocket(newSocket);

      // Connection events - FIXED: 'connect' not 'connection'
      newSocket.on('connect', () => {
        console.log('✅ Socket connected successfully with ID:', newSocket.id);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
      });

      newSocket.on('connect_error', err => {
        console.error('⚠️ Socket connection error:', err.message);
      });

      // Debug listener for ALL events
      newSocket.onAny((event, ...args) => {
        console.log(`🔔 Socket event received: ${event}`, args);
      });

      // Listen for specific friend-related events
      newSocket.on('friend_request', (data) => {
        console.log('📩 Received friend request:', data);
        incrementNotificationCount();
      });

      newSocket.on('friend_request_canceled', (data) => {
        console.log('🗑️ Friend request canceled:', data);
      });

      newSocket.on('friend_accepted', (data) => {
        console.log('✅ Friend request accepted:', data);
        incrementNotificationCount();
      });

      newSocket.on('friend_rejected', (data) => {
        console.log('❌ Friend request rejected:', data);
      })

      // Test ping-pong for connection health check
      const pingInterval = setInterval(() => {
        if (newSocket.connected) {
          newSocket.emit('ping', { timestamp: Date.now() });
        }
      }, 30000);

      newSocket.on('pong', (data) => {
        console.log('🏓 Pong received:', data);
      });

      // Clean up on unmount
      return () => {
        clearInterval(pingInterval);
        if (newSocket) {
          console.log('Disconnecting socket');
          newSocket.disconnect();
        }
        socketInitialized.current = false;
      };
    } catch (error: any) {
      console.error('Error setting up socket:', error);
      socketInitialized.current = false;
    }
  }, [authToken, userInfo?.id]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        notificationCount,
        incrementNotificationCount,
        resetNotificationCount,
        updateNotificationCount: updateNotificationCount,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

// Create a hook to use the socket context
export const useSocket = () => useContext(SocketContext);