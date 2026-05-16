import { io } from 'socket.io-client';

let socket = null;

export function connectSocket() {
  if (socket?.connected) return socket;
  try {
    socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      autoConnect: true,
      reconnection: true,
    });
    socket.on('connect', () => {
      console.log('SOCKET CONNECTED');
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
  const wrapped = (data) => {
    console.log('NEW ORDER RECEIVED', data?.order_number || data?.id);
    handler(data);
  };
  socket.on('new_order', wrapped);
  return () => socket.off('new_order', wrapped);
}

export function onOrderStatusUpdated(handler) {
  if (!socket) return () => {};
  const wrapped = (data) => {
    console.log('ORDER STATUS UPDATED RECEIVED', data?.order_number || data?.id, data?.order_status || data?.status);
    handler(data);
  };
  socket.on('order_status_updated', wrapped);
  return () => socket.off('order_status_updated', wrapped);
}

export function onPaymentUpdated(handler) {
  if (!socket) return () => {};
  const wrapped = (data) => {
    console.log('PAYMENT UPDATED RECEIVED', data?.orderId || data?.order_id);
    handler(data);
  };
  socket.on('payment_updated', wrapped);
  return () => socket.off('payment_updated', wrapped);
}

export function onServerCalled(handler) {
  if (!socket) return () => {};
  socket.on('server_called', handler);
  return () => socket.off('server_called', handler);
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
