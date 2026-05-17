import 'dotenv/config';
import pkg from 'pg';
import config from '../src/config/index.js';

const { Pool } = pkg;
const pool = new Pool({ connectionString: config.databaseUrl });

export async function runMigrations() {
  console.log('[migration] Running schema migrations...');

  const steps = [
    `ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS slug VARCHAR(150)`,
    `UPDATE restaurants SET slug = 'le-palais' WHERE slug IS NULL OR slug = ''`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(150)`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50)`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS kitchen_note TEXT`,
    `ALTER TABLE server_calls ADD COLUMN IF NOT EXISTS restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE`,
    `ALTER TABLE server_calls ADD COLUMN IF NOT EXISTS table_number VARCHAR(20)`,
    `UPDATE server_calls sc SET restaurant_id = rt.restaurant_id FROM restaurant_tables rt WHERE rt.id = sc.table_id AND sc.restaurant_id IS NULL`,
    `UPDATE server_calls sc SET table_number = rt.table_number FROM restaurant_tables rt WHERE rt.id = sc.table_id AND sc.table_number IS NULL`,
  ];

  for (const sql of steps) {
    try {
      await pool.query(sql);
      console.log(`[migration] OK: ${sql.substring(0, 80)}...`);
    } catch (err) {
      console.warn(`[migration] SKIP (${err.message}): ${sql.substring(0, 80)}...`);
    }
  }

  // Fix duplicate slugs before creating unique index
  try {
    const dupes = await pool.query('SELECT slug, COUNT(*) FROM restaurants GROUP BY slug HAVING COUNT(*) > 1');
    for (const row of dupes.rows) {
      const dupeRows = await pool.query('SELECT id, slug FROM restaurants WHERE slug = $1 ORDER BY id', [row.slug]);
      for (let i = 1; i < dupeRows.rows.length; i++) {
        await pool.query('UPDATE restaurants SET slug = $1 || \'-\' || $2 WHERE id = $3', [row.slug, dupeRows.rows[i].id, dupeRows.rows[i].id]);
      }
    }
    await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_restaurants_slug ON restaurants(slug)');
    console.log('[migration] OK: UNIQUE INDEX idx_restaurants_slug');
  } catch (err) {
    console.warn(`[migration] SKIP (${err.message}): UNIQUE INDEX idx_restaurants_slug`);
  }

  // Fix double-encoded UTF-8 accents in product/category names and descriptions
  try {
    const accentFixes = [
      "UPDATE products SET name = REPLACE(name, 'Ã©', 'é'), description = REPLACE(description, 'Ã©', 'é') WHERE name LIKE '%Ã©%' OR description LIKE '%Ã©%'",
      "UPDATE products SET name = REPLACE(name, 'Ã¨', 'è'), description = REPLACE(description, 'Ã¨', 'è') WHERE name LIKE '%Ã¨%' OR description LIKE '%Ã¨%'",
      "UPDATE products SET name = REPLACE(name, 'Ãª', 'ê'), description = REPLACE(description, 'Ãª', 'ê') WHERE name LIKE '%Ãª%' OR description LIKE '%Ãª%'",
      "UPDATE products SET name = REPLACE(name, 'Ã®', 'î'), description = REPLACE(description, 'Ã®', 'î') WHERE name LIKE '%Ã®%' OR description LIKE '%Ã®%'",
      "UPDATE products SET name = REPLACE(name, 'Ã§', 'ç'), description = REPLACE(description, 'Ã§', 'ç') WHERE name LIKE '%Ã§%' OR description LIKE '%Ã§%'",
      "UPDATE products SET name = REPLACE(name, 'Ã ', 'à'), description = REPLACE(description, 'Ã ', 'à') WHERE name LIKE '%Ã %' OR description LIKE '%Ã %'",
      "UPDATE products SET name = REPLACE(name, 'Å“', 'œ'), description = REPLACE(description, 'Å“', 'œ') WHERE name LIKE '%Å“%' OR description LIKE '%Å“%'",
      "UPDATE categories SET name = REPLACE(name, 'Ã©', 'é'), description = REPLACE(description, 'Ã©', 'é') WHERE name LIKE '%Ã©%' OR description LIKE '%Ã©%'",
      "UPDATE categories SET name = REPLACE(name, 'Ã¨', 'è'), description = REPLACE(description, 'Ã¨', 'è') WHERE name LIKE '%Ã¨%' OR description LIKE '%Ã¨%'",
      "UPDATE categories SET name = REPLACE(name, 'Ã®', 'î'), description = REPLACE(description, 'Ã®', 'î') WHERE name LIKE '%Ã®%' OR description LIKE '%Ã®%'",
    ];
    for (const sql of accentFixes) {
      const r = await pool.query(sql);
      if (r.rowCount > 0) console.log(`[migration] Accent fix: ${r.rowCount} rows`);
    }
    console.log('[migration] Accent fixes applied');
  } catch (err) {
    console.warn(`[migration] Accent fix skip (${err.message})`);
  }

  console.log('[migration] Done.');
}

// Allow running as standalone: node database/migration.js
const isMain = process.argv[1]?.endsWith('migration.js');
if (isMain) {
  runMigrations()
    .then(() => pool.end())
    .catch((err) => {
      console.error('Migration error:', err.message);
      process.exit(1);
    });
}

export default pool;
