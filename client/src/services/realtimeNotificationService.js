import { connectSocket, onOrderStatusUpdated } from './socketService';
import { notifyCustomerOrderStatus } from '../utils/notificationService';

let initialized = false;
let lastEventId = null;

function loadActiveOrder() {
  try {
    const id = localStorage.getItem('activeOrderId');
    if (!id) return null;
    return {
      id,
      slug: localStorage.getItem('activeRestaurantSlug') || '',
      tableId: localStorage.getItem('activeTableId') || '',
    };
  } catch { return null; }
}

export function initCustomerOrderTracking(t) {
  if (initialized) return;
  initialized = true;

  const socket = connectSocket();
  if (!socket) return;

  onOrderStatusUpdated((data) => {
    const eventId = data?.id || data?.order_number;
    if (!eventId) return;
    if (lastEventId === eventId) return;
    lastEventId = eventId;

    const active = loadActiveOrder();
    if (!active) return;

    const orderNum = data?.order_number || data?.orderNumber || '';
    if (String(orderNum) !== String(active.id)) return;

    const status = data?.order_status || data?.status || '';
    notifyCustomerOrderStatus({ orderNumber: orderNum, status }, t);

    localStorage.setItem('activeOrderStatus', status);
    try { window.dispatchEvent(new CustomEvent('order-status-changed')); } catch {}
  });
}

export function resetCustomerTracking() {
  initialized = false;
  lastEventId = null;
}
