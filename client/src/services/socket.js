import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_SOCKET_URL || 'https://barorder-qr.onrender.com', {
  autoConnect: false,
});

export default socket;
