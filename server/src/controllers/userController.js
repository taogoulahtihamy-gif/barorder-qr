import bcrypt from 'bcrypt';
import { query, queryOne } from '../config/database.js';
import { getRestaurantId } from '../utils/restaurantId.js';

const VALID_ROLES = ['admin', 'super_admin', 'manager', 'waiter', 'kitchen', 'cashier'];

export async function getUsers(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    const users = await query(
      `SELECT id, name, email, role, is_active, created_at FROM users WHERE restaurant_id = $1 ORDER BY created_at DESC`,
      [rid]
    );
    res.json(users);
  } catch (err) {
    console.error('[getUsers]', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function createUser(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password, role required' });
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) return res.status(400).json({ error: 'Email already used' });
    const hash = await bcrypt.hash(password, 10);
    const user = await queryOne(
      `INSERT INTO users (restaurant_id, name, email, password_hash, role, is_active) VALUES ($1,$2,$3,$4,$5,true) RETURNING id, name, email, role, is_active, created_at`,
      [rid, name, email, hash, role]
    );
    res.status(201).json(user);
  } catch (err) {
    console.error('[createUser]', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function updateUser(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    const userId = Number(req.params.id);
    const { name, email, password, role, is_active } = req.body;
    const existing = await queryOne('SELECT id FROM users WHERE id = $1 AND restaurant_id = $2', [userId, rid]);
    if (!existing) return res.status(404).json({ error: 'User not found' });
    if (role && !VALID_ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role' });
    const sets = [];
    const vals = [];
    let i = 1;
    if (name !== undefined) { sets.push(`name = $${i++}`); vals.push(name); }
    if (email !== undefined) { sets.push(`email = $${i++}`); vals.push(email); }
    if (role !== undefined) { sets.push(`role = $${i++}`); vals.push(role); }
    if (is_active !== undefined) { sets.push(`is_active = $${i++}`); vals.push(Boolean(is_active)); }
    if (password) { sets.push(`password_hash = $${i++}`); vals.push(await bcrypt.hash(password, 10)); }
    if (!sets.length) return res.status(400).json({ error: 'No fields to update' });
    vals.push(userId, rid);
    const user = await queryOne(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${i++} AND restaurant_id = $${i} RETURNING id, name, email, role, is_active, created_at`,
      vals
    );
    res.json(user);
  } catch (err) {
    console.error('[updateUser]', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function deleteUser(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    const userId = Number(req.params.id);
    await query('DELETE FROM users WHERE id = $1 AND restaurant_id = $2', [userId, rid]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('[deleteUser]', err.message);
    res.status(500).json({ error: err.message });
  }
}
