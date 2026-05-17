import { io } from 'socket.io-client';

let socket = null;

export function connectSocket() {
  if (socket?.connected) return socket;
  try {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const baseUrl = import.meta.env.VITE_SOCKET_URL || apiUrl.replace(/\/api$/, '') || window.location.origin;
    socket = io(baseUrl, {
      autoConnect: true,
      reconnection: true,
    });

    socket.on('connect_error', (err) => {
      console.warn('SOCKET ERROR', err.message);
    });
    return socket;
  } catch {
    console.warn('Socket unavailable');
    return null;
  }
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function onNewOrder(handler) {
  if (!socket) return () => {};
  socket.on('new_order', handler);
  return () => socket.off('new_order', handler);
}

export function onOrderStatusUpdated(handler) {
  if (!socket) return () => {};
  socket.on('order_status_updated', handler);
  return () => socket.off('order_status_updated', handler);
}

export function onPaymentUpdated(handler) {
  if (!socket) return () => {};
  socket.on('payment_updated', handler);
  return () => socket.off('payment_updated', handler);
}

export function onServerCalled(handler) {
  if (!socket) return () => {};
  socket.on('server_called', handler);
  return () => socket.off('server_called', handler);
}

export function onNewServerCall(handler) {
  if (!socket) return () => {};
  socket.on('new_server_call', handler);
  return () => socket.off('new_server_call', handler);
}

export function onServerCallUpdated(handler) {
  if (!socket) return () => {};
  socket.on('server_call_updated', handler);
  return () => socket.off('server_call_updated', handler);
}

export function emitOrderStatusUpdated(orderId, status) {
  if (socket) {
    socket.emit('order_status_updated', { orderId, status });
  }
}

export function emitServerCalled(tableId) {
  if (socket) {
    socket.emit('server_called', { tableId });
  }
}
