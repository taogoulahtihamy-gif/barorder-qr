import pkg from 'pg';
import config from './index.js';

const { Pool } = pkg;

const pool = new Pool({
  connectionString: config.databaseUrl,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[DB] Pool error:', err);
});

pool.on('connect', (client) => {
  client.query("SET client_encoding TO 'UTF8'").catch(() => {});
});

export async function query(text, params) {
  console.log('[DB] query:', text.substring(0, 100) + (text.length > 100 ? '...' : ''), params ? JSON.stringify(params) : '');
  const start = Date.now();
  try {
    const result = await pool.query({ text, values: params, timeout: 5000 });
    const elapsed = Date.now() - start;
    console.log(`[DB] done: ${result.rows.length} rows in ${elapsed}ms`);
    return result.rows;
  } catch (err) {
    const elapsed = Date.now() - start;
    console.error(`[DB] error after ${elapsed}ms:`, err.message);
    throw err;
  }
}

export async function queryOne(text, params) {
  const rows = await query(text, params);
  return rows[0] || null;
}

export default pool;
