import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, token } = useAuth();

  useEffect(() => {
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

  const joinRoom = (roomId) => {
    if (socket) {
      socket.emit('joinRoom', roomId, (response) => {
        console.log('Joined room:', response);
      });
    }
  };

  const leaveRoom = (roomId) => {
    if (socket) {
      socket.emit('leaveRoom', roomId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, joinRoom, leaveRoom }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};
