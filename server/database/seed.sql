TRUNCATE TABLE restaurants, users, categories, restaurant_tables, products, orders, order_items, payments, server_calls RESTART IDENTITY CASCADE;

INSERT INTO restaurants (name, address, phone, currency, primary_color) VALUES
  ('BarOrder Restaurant', '123 Avenue Principale, Dakar', '+221 77 123 45 67', 'FCFA', '#D4AF37');

INSERT INTO users (name, email, password_hash, role) VALUES
  ('Admin', 'admin@barorder.sn', '$2b$10$aPiB5TMyxpIHT9oQxxT0seg1hPGI0yZ0lBK853AQREg9hbJXpXGky', 'admin');

INSERT INTO categories (restaurant_id, name, description, sort_order, is_active) VALUES
  (1, 'Plats', 'Plats principaux', 1, true),
  (1, 'Grillades', 'Viandes grillées', 2, true),
  (1, 'Desserts', 'Desserts et pâtisseries', 3, true),
  (1, 'Boissons', 'Boissons fraîches et chaudes', 4, true),
  (1, 'Cocktails', 'Cocktails et mocktails', 5, true),
  (1, 'Promotions', 'Offres spéciales', 6, false);

INSERT INTO restaurant_tables (restaurant_id, table_number, qr_code_url, status) VALUES
  (1, 'Table 1', '/table/1', 'active'),
  (1, 'Table 2', '/table/2', 'active'),
  (1, 'Table 3', '/table/3', 'active'),
  (1, 'Table 4', '/table/4', 'active'),
  (1, 'Table 5', '/table/5', 'active'),
  (1, 'Table 6', '/table/6', 'active'),
  (1, 'Table 7', '/table/7', 'active'),
  (1, 'Table 8', '/table/8', 'active');

INSERT INTO products (restaurant_id, category_id, name, description, price, is_available, is_featured) VALUES
  (1, 1, 'Salade César', 'Romaine fraîche, parmesan, croûtons', 1250, true, false),
  (1, 1, 'Bruschetta', 'Tomate, basilic, mozzarella', 900, true, false),
  (1, 1, 'Pizza Margherita', 'Tomate, mozzarella, basilic', 1500, true, false),
  (1, 1, 'Spaghetti Carbonara', 'Guanciale, œuf, pecorino', 1650, true, false),
  (1, 1, 'Saumon grillé', 'Sauce au beurre de citron', 2450, true, false),
  (1, 2, 'Ribeye Steak', '300g avec légumes de saison', 2800, true, true),
  (1, 2, 'Assiette de grillades', 'Mix de viandes grillées', 3200, true, true),
  (1, 3, 'Tiramisu', 'Dessert italien classique', 900, true, false),
  (1, 3, 'Panna Cotta', 'Vanille avec coulis de baies', 850, false, false),
  (1, 4, 'Espresso', 'Double shot', 350, true, false),
  (1, 4, 'Limonade', 'Limonade maison', 450, false, false),
  (1, 5, 'Mojito', 'Menthe fraîche, citron vert, rhum', 1100, true, true),
  (1, 6, 'Menu du jour', 'Plat + dessert + boisson', 1800, true, false);

INSERT INTO orders (restaurant_id, table_id, order_number, customer_note, total_amount, payment_method, payment_status, order_status, created_at) VALUES
  (1, 1, '#1042', '', 4250, 'Wave', 'paid', 'pending', NOW() - INTERVAL '2 minutes'),
  (1, 3, '#1041', 'sans glaçon', 2800, 'Cash', 'pending', 'preparing', NOW() - INTERVAL '10 minutes'),
  (1, 5, '#1040', '', 1500, 'Wave', 'paid', 'ready', NOW() - INTERVAL '18 minutes'),
  (1, 7, '#1039', 'bien cuit', 3550, 'Cash', 'paid', 'served', NOW() - INTERVAL '35 minutes'),
  (1, 2, '#1038', '', 2450, 'Wave', 'paid', 'paid', NOW() - INTERVAL '50 minutes');

INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price) VALUES
  (1, 6, 'Ribeye Steak', 1, 2800, 2800),
  (1, 12, 'Mojito', 1, 1100, 1100),
  (1, 10, 'Espresso', 1, 350, 350),
  (2, 1, 'Salade César', 1, 1250, 1250),
  (2, 10, 'Espresso', 2, 350, 700),
  (2, 11, 'Limonade', 1, 450, 450),
  (3, 3, 'Pizza Margherita', 1, 1500, 1500),
  (4, 4, 'Spaghetti Carbonara', 1, 1650, 1650),
  (4, 8, 'Tiramisu', 1, 900, 900),
  (5, 5, 'Saumon grillé', 1, 2450, 2450);

INSERT INTO payments (order_id, method, amount, status, transaction_reference) VALUES
  (1, 'Wave', 4250, 'paid', 'WAVE-001'),
  (2, 'Cash', 2800, 'pending', '-'),
  (3, 'Wave', 1500, 'paid', 'WAVE-002'),
  (4, 'Cash', 3550, 'paid', '-');
