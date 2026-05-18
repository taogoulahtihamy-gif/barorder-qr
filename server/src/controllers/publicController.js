import { query, queryOne } from '../config/database.js';
import { DEFAULT_RESTAURANT_ID } from '../utils/restaurantId.js';

export async function getRestaurants(req, res) {
  try {
    let restaurants;
    try {
      restaurants = await query('SELECT id, name, slug, logo_url, address, phone, currency, primary_color FROM restaurants ORDER BY name');
    } catch (err) {
      if (err.message?.includes('slug')) {
        restaurants = await query('SELECT id, name, logo_url, address, phone, currency, primary_color FROM restaurants ORDER BY name');
      } else {
        throw err;
      }
    }
    res.json(restaurants);
  } catch (err) {
    console.error('[getRestaurants] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function getRestaurantBySlug(req, res) {
  try {
    const { slug } = req.params;
    let restaurant;
    try {
      restaurant = await queryOne('SELECT * FROM restaurants WHERE slug = $1', [slug]);
    } catch (err) {
      if (err.message?.includes('slug')) {
        restaurant = await queryOne('SELECT * FROM restaurants WHERE id = $1', [DEFAULT_RESTAURANT_ID]);
      } else {
        throw err;
      }
    }
    if (!restaurant) {
      restaurant = await queryOne('SELECT * FROM restaurants WHERE id = $1', [DEFAULT_RESTAURANT_ID]);
    }
    if (!restaurant) return res.status(404).json({ error: 'Restaurant non trouvé' });
    res.json(restaurant);
  } catch (err) {
    console.error('[getRestaurantBySlug] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function getTable(req, res) {
  try {
    const tableId = Number(req.params.tableId);
    let table;
    try {
      table = await queryOne(`
        SELECT rt.*, r.name as restaurant_name, r.slug, r.logo_url, r.currency, r.primary_color
        FROM restaurant_tables rt
        JOIN restaurants r ON r.id = rt.restaurant_id
        WHERE rt.id = $1
      `, [tableId]);
    } catch (err) {
      if (err.message?.includes('slug')) {
        table = await queryOne(`
          SELECT rt.*, r.name as restaurant_name, r.logo_url, r.currency, r.primary_color
          FROM restaurant_tables rt
          JOIN restaurants r ON r.id = rt.restaurant_id
          WHERE rt.id = $1
        `, [tableId]);
      } else {
        throw err;
      }
    }
    if (!table) return res.status(404).json({ error: 'Table non trouvée' });
    res.json({ table, restaurant: { name: table.restaurant_name, slug: table.slug || '', logo_url: table.logo_url, currency: table.currency, primary_color: table.primary_color } });
  } catch (err) {
    console.error('[getTable] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function getMenu(req, res) {
  try {
    const restaurantId = Number(req.params.restaurantId);
    console.log('[MENU] Fetching menu for restaurant:', restaurantId);
    const categories = await query(
      'SELECT id, name, description, sort_order FROM categories WHERE restaurant_id = $1 AND is_active = true ORDER BY sort_order',
      [restaurantId]
    );
    console.log('[MENU] Categories fetched:', categories.length);
    const products = await query(
      `SELECT p.id, p.name, p.description, p.price, p.image_url, p.category_id, p.is_available, p.is_featured,
              COALESCE(c.name, '') as category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.restaurant_id = $1 AND p.is_available = true
       ORDER BY p.is_featured DESC, p.name`,
      [restaurantId]
    );
    console.log('[MENU] Products fetched:', products.length);
    res.json({ categories, products });
  } catch (err) {
    console.error('[MENU] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function getMenuBySlug(req, res) {
  try {
    const { slug, tableId } = req.params;

    let restaurant;
    try {
      restaurant = await queryOne('SELECT id, name, slug, logo_url, primary_color, currency FROM restaurants WHERE slug = $1', [slug]);
    } catch (err) {
      if (err.message?.includes('slug')) {
        console.warn('[getMenuBySlug] slug column missing, falling back to restaurant_id =', DEFAULT_RESTAURANT_ID);
        restaurant = await queryOne('SELECT id, name, logo_url, primary_color, currency FROM restaurants WHERE id = $1', [DEFAULT_RESTAURANT_ID]);
      } else {
        throw err;
      }
    }

    if (!restaurant) {
      console.warn('[getMenuBySlug] slug not found, falling back to restaurant_id =', DEFAULT_RESTAURANT_ID);
      restaurant = await queryOne('SELECT id, name, logo_url, primary_color, currency FROM restaurants WHERE id = $1', [DEFAULT_RESTAURANT_ID]);
    }

    if (!restaurant) return res.status(404).json({ error: 'Restaurant non trouvé' });

    const rid = Number(restaurant.id);

    const categories = await query(
      'SELECT id, name, description, sort_order FROM categories WHERE restaurant_id = $1 AND is_active = true ORDER BY sort_order',
      [rid]
    );
    const products = await query(
      `SELECT p.id, p.name, p.description, p.price, p.image_url, p.category_id, p.is_available, p.is_featured,
              COALESCE(c.name, '') as category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.restaurant_id = $1 AND p.is_available = true
       ORDER BY p.is_featured DESC, p.name`,
      [rid]
    );
    let table = null;
    if (tableId) {
      console.log("REQUESTED TABLE:", tableId);
      table = await queryOne(`SELECT id, table_number, qr_code_url FROM restaurant_tables WHERE restaurant_id = $1 AND (id::text = $2 OR table_number::text = $2) LIMIT 1`, [rid, String(tableId)]);
      console.log("RESOLVED TABLE ID:", table?.id);
    }
    res.json({ restaurant, table, categories, products });
  } catch (err) {
    console.error('[getMenuBySlug] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function createOrder(req, res) {
  try {
    const { restaurantId, tableId, items, customerName, customerPhone, customerNote, kitchenNote, totalAmount, paymentMethod, paymentStatus } = req.body;
    if (!items || !items.length) {
      return res.status(400).json({ error: 'La commande doit contenir au moins un article' });
    }

    const rid = Number(restaurantId);
    if (isNaN(rid) || !Number.isInteger(rid) || rid < 1) {
      return res.status(400).json({ error: 'ID restaurant invalide' });
    }

    if (!tableId) {
      return res.status(400).json({ error: 'Table non spécifiée' });
    }

    const roundedTotal = Math.round(Number(totalAmount));
    if (isNaN(roundedTotal) || roundedTotal < 0) {
      return res.status(400).json({ error: 'Montant total invalide' });
    }

    for (const item of items) {
      const qty = Number(item.quantity);
      const price = Math.round(Number(item.price));
      if (isNaN(qty) || !Number.isInteger(qty) || qty < 1) {
        return res.status(400).json({ error: `Quantité invalide pour ${item.name || 'un article'}` });
      }
      if (isNaN(price) || price < 0) {
        return res.status(400).json({ error: `Prix invalide pour ${item.name || 'un article'}` });
      }
      if (item.type === 'product') {
        const pid = Number(item.product_id);
        if (!item.product_id || isNaN(pid) || !Number.isInteger(pid) || pid < 1) {
          return res.status(400).json({ error: `ID produit invalide pour ${item.name || 'un article'}` });
        }
      }
    }

    const orderNumber = `ORD-${Date.now()}`;
    const requestedTable = String(tableId || '');

    console.log("REQUESTED TABLE:", requestedTable);

    let resolvedTableId = null;
    if (requestedTable) {
      const table = await queryOne(`
        SELECT id FROM restaurant_tables
        WHERE restaurant_id = $1
        AND (id::text = $2 OR table_number::text = $2)
        LIMIT 1
      `, [rid, requestedTable]);
      if (!table) {
        return res.status(400).json({ error: "Table introuvable" });
      }
      resolvedTableId = table.id;
    }

    console.log("RESOLVED TABLE ID:", resolvedTableId);
    console.log('[createOrder]', { restaurantId: rid, tableId: resolvedTableId, items: items.length, totalAmount: roundedTotal, paymentMethod });

    const order = await queryOne(`
      INSERT INTO orders (restaurant_id, table_id, order_number, customer_name, customer_phone, customer_note, kitchen_note, total_amount, payment_method, payment_status, order_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'new')
      RETURNING *
    `, [rid, resolvedTableId, orderNumber, customerName || '', customerPhone || '', customerNote || '', kitchenNote || '', roundedTotal, paymentMethod, paymentStatus || 'pending']);

    console.log('[createOrder] order created:', order.id, orderNumber);

    for (const item of items) {
      const qty = Number(item.quantity);
      const price = Math.round(Number(item.price));
      let productId;
      if (item.type === 'promotion') {
        productId = null;
      } else {
        productId = Number(item.product_id || item.id);
        if (isNaN(productId)) productId = null;
      }
      await query(`
        INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [order.id, productId, item.name, qty, price, qty * price]);
    }

    const paidMethods = ['wave', 'orange_money'];
    if (paidMethods.includes(paymentMethod) && paymentStatus === 'paid') {
      const methodLabel = paymentMethod === 'orange_money' ? 'Orange Money' : 'Wave';
      await query(`
        INSERT INTO payments (order_id, method, amount, status, transaction_reference)
        VALUES ($1, $2, $3, 'paid', $4 || '-' || $5)
      `, [order.id, methodLabel, roundedTotal, paymentMethod.toUpperCase(), Date.now()]);
      try {
        req.app.get('io').emit('payment_updated', { orderId: order.id, status: 'paid' });
        req.app.get('io').emit('orders_updated', { orderId: order.id });
        console.log('[SOCKET EMIT] payment_updated + orders_updated', order.id);
      } catch (e) {
        console.warn('[createOrder] payment socket emit failed:', e.message);
      }
    }

    let fullOrder;
    try {
      fullOrder = await queryOne(`
        SELECT o.*, r.slug as restaurant_slug
        FROM orders o
        LEFT JOIN restaurants r ON r.id = o.restaurant_id
        WHERE o.id = $1
      `, [order.id]);
    } catch (err) {
      if (err.message?.includes('slug')) {
        fullOrder = await queryOne(`
          SELECT o.*
          FROM orders o
          WHERE o.id = $1
        `, [order.id]);
        fullOrder.restaurant_slug = '';
      } else {
        throw err;
      }
    }

    const orderItems = await query(`
      SELECT * FROM order_items WHERE order_id = $1
    `, [order.id]);

    try {
      req.app.get('io').emit('new_order', { ...fullOrder, items: orderItems });
      req.app.get('io').emit('orders_updated', { orderId: order.id });
      req.app.get('io').emit('kitchen_updated', { orderId: order.id });
      console.log('[SOCKET EMIT] new_order + orders_updated + kitchen_updated', orderNumber);
    } catch (e) {
      console.warn('[createOrder] socket emit failed:', e.message);
    }

    console.log('[createOrder] success:', orderNumber);
    res.status(201).json({ ...fullOrder, items: orderItems });
  } catch (err) {
    console.error('[createOrder] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function getOrderByNumber(req, res) {
  try {
    const { orderNumber } = req.params;
    let order;
    try {
      order = await queryOne(`
        SELECT o.*, rt.table_number, r.slug as restaurant_slug, r.name as restaurant_name
        FROM orders o
        LEFT JOIN restaurant_tables rt ON rt.id = o.table_id
        LEFT JOIN restaurants r ON r.id = o.restaurant_id
        WHERE o.order_number = $1
      `, [orderNumber]);
    } catch (err) {
      if (err.message?.includes('slug')) {
        order = await queryOne(`
          SELECT o.*, rt.table_number, r.name as restaurant_name
          FROM orders o
          LEFT JOIN restaurant_tables rt ON rt.id = o.table_id
          LEFT JOIN restaurants r ON r.id = o.restaurant_id
          WHERE o.order_number = $1
        `, [orderNumber]);
        if (order) order.restaurant_slug = '';
      } else {
        throw err;
      }
    }
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });
    const items = await query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
    res.json({ ...order, items });
  } catch (err) {
    console.error('[getOrderByNumber] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function callServer(req, res) {
  try {
    const { tableId, message, restaurantId } = req.body;
    if (!tableId) return res.status(400).json({ error: 'Numéro de table requis' });

    const rid = Number(restaurantId) || DEFAULT_RESTAURANT_ID;
    const requestedTable = String(tableId);

    console.log("REQUESTED TABLE:", requestedTable);

    const table = await queryOne(`
      SELECT id, table_number FROM restaurant_tables
      WHERE restaurant_id = $1
      AND (id::text = $2 OR table_number::text = $2)
      LIMIT 1
    `, [rid, requestedTable]);

    if (!table) {
      return res.status(400).json({ error: "Table introuvable" });
    }

    const resolvedTableId = table.id;
    const resolvedTableNumber = table.table_number;
    console.log("RESOLVED TABLE ID:", resolvedTableId);

    const call = await queryOne(`
      INSERT INTO server_calls (restaurant_id, table_id, table_number, status, message)
      VALUES ($1::int, $2::int, $3::text, 'pending', $4::text)
      RETURNING *
    `, [rid, resolvedTableId, resolvedTableNumber, message || '']);
    try {
      req.app.get('io').emit('server_call_created', call);
      req.app.get('io').emit('new_server_call', call);
      req.app.get('io').emit('server_calls_updated', { serverCallId: call.id });
      console.log('[SOCKET EMIT] server_call_created + new_server_call + server_calls_updated');
    } catch {}
    res.status(201).json(call);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}