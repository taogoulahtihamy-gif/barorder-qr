import api from './api';

function mapOrder(o) {
  if (!o) return null;
  return {
    id: o.id,
    orderNumber: o.order_number || o.orderNumber,
    restaurantId: o.restaurant_id,
    restaurantSlug: o.restaurant_slug || o.restaurantSlug || '',
    tableId: o.table_id,
    tableNumber: o.table_number,
    status: o.order_status || o.status || 'pending',
    paymentStatus: o.payment_status || o.paymentStatus || 'pending',
    paymentMethod: o.payment_method || o.paymentMethod,
    totalAmount: o.total_amount != null ? o.total_amount : o.totalAmount,
    customerName: o.customer_name || o.customerName || '',
    customerPhone: o.customer_phone || o.customerPhone || '',
    customerNote: o.customer_note || o.customerNote || '',
    kitchenNote: o.kitchen_note || o.kitchenNote || '',
    items: (o.items || []).map(i => ({
      id: i.id,
      productId: i.product_id,
      name: i.product_name || i.name,
      quantity: i.quantity,
      unitPrice: i.unit_price || i.unitPrice || i.price,
      totalPrice: i.total_price || i.totalPrice,
    })),
    createdAt: o.created_at || o.createdAt,
    estimatedTime: o.estimatedTime || '20-30 min',
  };
}

export async function createOrder(orderData) {
  const items = (orderData.items || []).map((i) => {
    const qty = Number(i.quantity) || 1;
    const price = Number(i.price) || 0;
    if (i.type === 'promotion') {
      return {
        type: 'promotion',
        id: i.id,
        name: i.name,
        price,
        quantity: qty,
        product_id: null,
        promotion_id: Number(i.promotion_id) || null,
      };
    }
    return {
      type: 'product',
      id: i.id,
      name: i.name,
      price,
      quantity: qty,
      product_id: Number(i.product_id || i.id) || null,
    };
  });
  const totalAmount = Math.round(Number(orderData.totalAmount)) || 0;
  const tableId = orderData.tableId ? Number(orderData.tableId) : null;
  const payload = {
    restaurantId: parseInt(orderData.restaurantId, 10) || 1,
    tableId,
    items,
    customerName: orderData.customerName || '',
    customerPhone: orderData.customerPhone || '',
    kitchenNote: orderData.kitchenNote || '',
    totalAmount,
    paymentMethod: orderData.paymentMethod,
    paymentStatus: orderData.paymentStatus || 'pending',
  };
  if (import.meta.env.DEV) console.log('[orderService] createOrder payload:', JSON.stringify(payload));
  const { data } = await api.post('/api/public/orders', payload);
  return mapOrder(data);
}

export async function getOrder(orderNumber) {
  const { data } = await api.get(`/api/public/orders/${orderNumber}`);
  return mapOrder(data);
}

export async function callServer(tableId, restaurantId) {
  const { data } = await api.post('/api/public/server-call', { tableId, restaurantId });
  return data;
}