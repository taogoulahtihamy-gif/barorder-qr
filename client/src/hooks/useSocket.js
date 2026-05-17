import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const apiUrl = import.meta.env.VITE_API_URL || '';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || apiUrl.replace(/\/api$/, '') || window.location.origin;

export default function useSocket(event, handler) {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL);
    if (event && handler) {
      socketRef.current.on(event, handler);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [event, handler]);

  return socketRef;
}
