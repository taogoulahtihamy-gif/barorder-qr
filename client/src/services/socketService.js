import { io } from 'socket.io-client';

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 20;

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://barorder-qr.onrender.com';

export function connectSocket() {
  if (socket?.connected) return socket;
  try {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
    });

    socket.on('connect', () => {
      reconnectAttempts = 0;
      if (import.meta.env.DEV) console.log('[SOCKET CONNECTED]');
    });

    socket.on('connect_error', (err) => {
      reconnectAttempts++;
      console.warn('[Socket] connect_error:', err.message, `(attempt ${reconnectAttempts})`);
    });

    socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });
    return socket;
  } catch {
    console.warn('[Socket] unavailable');
    return null;
  }
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    reconnectAttempts = 0;
  }
}

function wrapHandler(eventName, handler) {
  return (...args) => {
    if (import.meta.env.DEV) console.log('[SOCKET EVENT RECEIVED]', eventName);
    handler(...args);
  };
}

export function onNewOrder(handler) {
  if (!socket) return () => {};
  const wrapped = wrapHandler('new_order', handler);
  socket.on('new_order', wrapped);
  return () => socket.off('new_order', wrapped);
}

export function onOrderStatusUpdated(handler) {
  if (!socket) return () => {};
  const wrapped = wrapHandler('order_status_updated', handler);
  socket.on('order_status_updated', wrapped);
  return () => socket.off('order_status_updated', wrapped);
}

export function onPaymentUpdated(handler) {
  if (!socket) return () => {};
  const wrapped = wrapHandler('payment_updated', handler);
  socket.on('payment_updated', wrapped);
  return () => socket.off('payment_updated', wrapped);
}

export function onOrdersUpdated(handler) {
  if (!socket) return () => {};
  const wrapped = wrapHandler('orders_updated', handler);
  socket.on('orders_updated', wrapped);
  return () => socket.off('orders_updated', wrapped);
}

export function onKitchenUpdated(handler) {
  if (!socket) return () => {};
  const wrapped = wrapHandler('kitchen_updated', handler);
  socket.on('kitchen_updated', wrapped);
  return () => socket.off('kitchen_updated', wrapped);
}

export function onServerCalled(handler) {
  if (!socket) return () => {};
  const wrapped = wrapHandler('server_called', handler);
  socket.on('server_called', wrapped);
  return () => socket.off('server_called', wrapped);
}

export function onNewServerCall(handler) {
  if (!socket) return () => {};
  const wrapped = wrapHandler('new_server_call', handler);
  socket.on('new_server_call', wrapped);
  return () => socket.off('new_server_call', wrapped);
}

export function onServerCallUpdated(handler) {
  if (!socket) return () => {};
  const wrapped = wrapHandler('server_call_updated', handler);
  socket.on('server_call_updated', wrapped);
  return () => socket.off('server_call_updated', wrapped);
}

export function onServerCallsUpdated(handler) {
  if (!socket) return () => {};
  const wrapped = wrapHandler('server_calls_updated', handler);
  socket.on('server_calls_updated', wrapped);
  return () => socket.off('server_calls_updated', wrapped);
}

export function onTableStatusUpdated(handler) {
  if (!socket) return () => {};
  const wrapped = wrapHandler('table_status_updated', handler);
  socket.on('table_status_updated', wrapped);
  return () => socket.off('table_status_updated', wrapped);
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
