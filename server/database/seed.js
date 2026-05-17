import 'dotenv/config';
import pkg from 'pg';
import bcrypt from 'bcrypt';
import config from '../src/config/index.js';

const { Pool } = pkg;
const pool = new Pool({ connectionString: config.databaseUrl });

async function seed() {
  console.log('Seeding database...');
  await pool.query("SET client_encoding TO 'UTF8'");

  const passwordHash = await bcrypt.hash('admin123', 10);

  await pool.query(`
    INSERT INTO restaurants (name, slug, logo_url, address, phone, currency, primary_color)
    VALUES ('BarOrder', 'barorder', '', '123 Rue Principale, Dakar', '+221 77 123 45 67', 'FCFA', '#D4AF37')
    ON CONFLICT DO NOTHING;
  `);

  const rc = await pool.query(`SELECT id FROM restaurants LIMIT 1`);
  const restaurantId = rc.rows[0].id;

  const demoUsers = [
    { name: 'Super Admin', email: 'super@barorder.sn', role: 'super_admin' },
    { name: 'Manager', email: 'manager@barorder.sn', role: 'manager' },
    { name: 'Waiter', email: 'waiter@barorder.sn', role: 'waiter' },
    { name: 'Kitchen', email: 'kitchen@barorder.sn', role: 'kitchen' },
    { name: 'Cashier', email: 'cashier@barorder.sn', role: 'cashier' },
  ];

  for (const u of demoUsers) {
    await pool.query(`
      INSERT INTO users (restaurant_id, name, email, password_hash, role, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      ON CONFLICT (email) DO UPDATE SET role = $5, is_active = true;
    `, [restaurantId, u.name, u.email, passwordHash, u.role]);
  }

  for (let i = 1; i <= 10; i++) {
    await pool.query(`
      INSERT INTO restaurant_tables (restaurant_id, table_number, status)
      VALUES ($1, $2, 'active')
      ON CONFLICT DO NOTHING;
    `, [restaurantId, `Table ${i}`]);
  }

  const catData = [
    { name: 'Boissons', sort_order: 1 },
    { name: 'Cocktails', sort_order: 2 },
    { name: 'Plats', sort_order: 3 },
    { name: 'Grillades', sort_order: 4 },
    { name: 'Desserts', sort_order: 5 },
    { name: 'Promotions', sort_order: 6 },
  ];

  const catIds = {};
  for (const cat of catData) {
    const result = await pool.query(`
      INSERT INTO categories (restaurant_id, name, sort_order, is_active)
      VALUES ($1, $2, $3, true)
      RETURNING id;
    `, [restaurantId, cat.name, cat.sort_order]);
    catIds[cat.name] = result.rows[0].id;
  }

  const productData = [
    { name: 'Eau minérale', description: 'Bouteille 50cl', price: 500, category: 'Boissons' },
    { name: 'Jus d\'orange frais', description: 'Jus pressé maison', price: 1500, category: 'Boissons' },
    { name: 'Coca-Cola', description: 'Canette 33cl', price: 800, category: 'Boissons' },
    { name: 'Mojito', description: 'Menthe fraîche, citron vert, rhum', price: 2500, category: 'Cocktails' },
    { name: 'Margarita', description: 'Tequila, citron, triple sec', price: 3000, category: 'Cocktails' },
    { name: 'Mocktail tropical', description: 'Jus de fruits sans alcool', price: 2000, category: 'Cocktails', featured: true },
    { name: 'Salade César', description: 'Romaine fraîche, parmesan, croûtons', price: 3500, category: 'Plats' },
    { name: 'Bruschetta', description: 'Tomate, basilic, mozzarella', price: 2500, category: 'Plats' },
    { name: 'Pizza Margherita', description: 'Tomate, mozzarella, basilic', price: 4000, category: 'Plats' },
    { name: 'Spaghetti Carbonara', description: 'Guanciale, œuf, pecorino', price: 4500, category: 'Plats', featured: true },
    { name: 'Saumon grillé', description: 'Sauce au beurre de citron', price: 5500, category: 'Plats', featured: true },
    { name: 'Ribeye Steak', description: '300g avec légumes de saison', price: 6500, category: 'Grillades', featured: true },
    { name: 'Assiette de grillades', description: 'Mix de viandes grillées', price: 7500, category: 'Grillades', featured: true },
    { name: 'Poulet braisé', description: 'Poulet fermier, sauce aux épices', price: 5000, category: 'Grillades' },
    { name: 'Tiramisu', description: 'Dessert italien classique', price: 2500, category: 'Desserts', featured: true },
    { name: 'Panna Cotta', description: 'Vanille avec coulis de baies', price: 2000, category: 'Desserts' },
    { name: 'Fondant au chocolat', description: 'Cœur coulant, glace vanille', price: 3000, category: 'Desserts', featured: true },
    { name: 'Menu du jour', description: 'Plat + dessert + boisson', price: 5500, category: 'Promotions', featured: true },
    { name: 'Formule déjeuner', description: 'Plat + boisson', price: 4500, category: 'Promotions' },
    { name: 'Menu enfant', description: 'Plat + dessert + boisson', price: 3500, category: 'Promotions' },
  ];

  for (const prod of productData) {
    await pool.query(`
      INSERT INTO products (restaurant_id, category_id, name, description, price, is_available, is_featured)
      VALUES ($1, $2, $3, $4, $5, true, $6);
    `, [restaurantId, catIds[prod.category], prod.name, prod.description, prod.price, prod.featured || false]);
  }

  const tc = await pool.query(`SELECT id FROM restaurant_tables ORDER BY id`);
  const tables = tc.rows;

  await pool.query(`
    INSERT INTO orders (restaurant_id, table_id, order_number, total_amount, payment_method, payment_status, order_status, created_at)
    VALUES ($1, $2, 'ORD-1001', 13000, 'Wave', 'paid', 'served', NOW() - INTERVAL '2 hours');
  `, [restaurantId, tables[0].id]);

  const o1 = await pool.query(`SELECT id FROM orders WHERE order_number = 'ORD-1001'`);
  const o1Id = o1.rows[0].id;

  await pool.query(`
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
    VALUES ($1, (SELECT id FROM products WHERE name = 'Ribeye Steak' LIMIT 1), 'Ribeye Steak', 2, 6500, 13000);
  `, [o1Id]);

  await pool.query(`
    INSERT INTO payments (order_id, method, amount, status, transaction_reference)
    VALUES ($1, 'Wave', 13000, 'paid', 'WAVE-REF-001');
  `, [o1Id]);

  await pool.query(`
    INSERT INTO orders (restaurant_id, table_id, order_number, total_amount, payment_method, payment_status, order_status, customer_note, created_at)
    VALUES ($1, $2, 'ORD-1002', 8500, 'Cash', 'pending', 'preparing', 'sans glaçon', NOW() - INTERVAL '1 hour');
  `, [restaurantId, tables[2].id]);

  const o2 = await pool.query(`SELECT id FROM orders WHERE order_number = 'ORD-1002'`);
  const o2Id = o2.rows[0].id;

  await pool.query(`
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
    VALUES
      ($1, (SELECT id FROM products WHERE name = 'Mojito' LIMIT 1), 'Mojito', 2, 2500, 5000),
      ($1, (SELECT id FROM products WHERE name = 'Tiramisu' LIMIT 1), 'Tiramisu', 1, 3500, 3500);
  `, [o2Id]);

  await pool.query(`
    INSERT INTO orders (restaurant_id, table_id, order_number, total_amount, payment_method, payment_status, order_status, created_at)
    VALUES ($1, $2, 'ORD-1003', 4000, 'Wave', 'paid', 'new', NOW() - INTERVAL '15 minutes');
  `, [restaurantId, tables[4].id]);

  const o3 = await pool.query(`SELECT id FROM orders WHERE order_number = 'ORD-1003'`);
  const o3Id = o3.rows[0].id;

  await pool.query(`
    INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price)
    VALUES ($1, (SELECT id FROM products WHERE name = 'Pizza Margherita' LIMIT 1), 'Pizza Margherita', 1, 4000, 4000);
  `, [o3Id]);

  await pool.query(`
    INSERT INTO payments (order_id, method, amount, status, transaction_reference)
    VALUES ($1, 'Wave', 4000, 'paid', 'WAVE-REF-002');
  `, [o3Id]);

  await pool.query(`
    INSERT INTO server_calls (table_id, status, message, created_at)
    VALUES ($1, 'new', 'Besoin d''aide', NOW() - INTERVAL '10 minutes');
  `, [tables[1].id]);

  console.log('Seed complete!');
  console.log('Demo users:');
  console.log('  super@barorder.sn / admin123 (super_admin)');
  console.log('  manager@barorder.sn / admin123 (manager)');
  console.log('  waiter@barorder.sn / admin123 (waiter)');
  console.log('  kitchen@barorder.sn / admin123 (kitchen)');
  console.log('  cashier@barorder.sn / admin123 (cashier)');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
