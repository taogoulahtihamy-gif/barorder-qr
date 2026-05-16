import api from './api';

function mapOrder(o) {
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
  const { data } = await api.post('/public/orders', {
    restaurantId: parseInt(orderData.restaurantId) || 1,
    tableId: orderData.tableId || null,
    items: orderData.items,
    customerName: orderData.customerName || '',
    customerPhone: orderData.customerPhone || '',
    kitchenNote: orderData.kitchenNote || '',
    totalAmount: Math.round(orderData.totalAmount),
    paymentMethod: orderData.paymentMethod,
    paymentStatus: orderData.paymentStatus || 'pending',
  });
  return mapOrder(data);
}

export async function getOrder(orderNumber) {
  const { data } = await api.get(`/public/orders/${orderNumber}`);
  return mapOrder(data);
}

export async function callServer(tableId, restaurantId) {
  const { data } = await api.post('/public/server-call', { tableId, restaurantId });
  return data;
}