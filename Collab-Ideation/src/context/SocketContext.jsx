import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, token } = useAuth();

  useEffect(() => {
    // This effect is correct. It creates the connection when the user changes.
    if (user && token) {
      const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
        auth: { token }
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user, token]);

  // FIX #1: Memoize the functions with useCallback
  const joinRoom = useCallback((roomId) => {
    if (socket) {
      socket.emit('joinRoom', roomId, (response) => {
        console.log('Joined room:', response);
      });
    }
  }, [socket]);

  const leaveRoom = useCallback((roomId) => {
    if (socket) {
      socket.emit('leaveRoom', roomId);
    }
  }, [socket]);

  // FIX #2: Memoize the context value object with useMemo
  const contextValue = useMemo(() => ({
    socket,
    joinRoom,
    leaveRoom
  }), [socket, joinRoom, leaveRoom]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};