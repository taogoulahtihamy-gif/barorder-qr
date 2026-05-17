import { io } from 'socket.io-client';

const apiUrl = import.meta.env.VITE_API_URL || '';
const socketBase = import.meta.env.VITE_SOCKET_URL || apiUrl.replace(/\/api$/, '') || window.location.origin;
const socket = io(socketBase, {
  autoConnect: false,
});

export default socket;
