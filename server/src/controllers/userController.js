import bcrypt from 'bcrypt';
import { query, queryOne } from '../config/database.js';
import { getRestaurantId } from '../utils/restaurantId.js';

const VALID_ROLES = ['admin', 'super_admin', 'manager', 'waiter', 'kitchen', 'cashier'];

const CAN_CREATE_ROLE = {
  super_admin: ['admin', 'super_admin', 'manager', 'waiter', 'kitchen', 'cashier'],
  admin: ['admin', 'manager', 'waiter', 'kitchen', 'cashier'],
};

export async function getUsers(req, res) {
  try {
    let users;
    if (req.user.role === 'super_admin') {
      users = await query(
        `SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at, u.restaurant_id, r.name as restaurant_name
         FROM users u LEFT JOIN restaurants r ON r.id = u.restaurant_id
         ORDER BY u.created_at DESC`
      );
    } else {
      const rid = Number(getRestaurantId(req));
      users = await query(
        `SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at, u.restaurant_id, r.name as restaurant_name
         FROM users u LEFT JOIN restaurants r ON r.id = u.restaurant_id
         WHERE u.restaurant_id = $1 ORDER BY u.created_at DESC`,
        [rid]
      );
    }
    res.json(users);
  } catch (err) {
    console.error('[getUsers]', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function createUser(req, res) {
  try {
    const rid = req.user.role === 'super_admin' && req.body.restaurant_id
      ? Number(req.body.restaurant_id)
      : Number(getRestaurantId(req));
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password, role required' });
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const allowed = CAN_CREATE_ROLE[req.user.role] || [];
    if (!allowed.includes(role)) {
      return res.status(403).json({ error: 'You cannot create this role' });
    }
    if (req.user.role !== 'super_admin') {
      const restCheck = await queryOne('SELECT id FROM restaurants WHERE id = $1', [rid]);
      if (!restCheck) return res.status(400).json({ error: 'Restaurant not found' });
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
    const userId = Number(req.params.id);
    const { name, email, password, role, is_active, restaurant_id } = req.body;
    let existing;
    if (req.user.role === 'super_admin') {
      existing = await queryOne('SELECT id FROM users WHERE id = $1', [userId]);
    } else {
      const rid = Number(getRestaurantId(req));
      existing = await queryOne('SELECT id FROM users WHERE id = $1 AND restaurant_id = $2', [userId, rid]);
    }
    if (!existing) return res.status(404).json({ error: 'User not found' });
    if (role && !VALID_ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role' });
    if (role) {
      const allowed = CAN_CREATE_ROLE[req.user.role] || [];
      if (!allowed.includes(role)) return res.status(403).json({ error: 'You cannot set this role' });
    }
    const sets = [];
    const vals = [];
    let i = 1;
    if (name !== undefined) { sets.push(`name = $${i++}`); vals.push(name); }
    if (email !== undefined) { sets.push(`email = $${i++}`); vals.push(email); }
    if (role !== undefined) { sets.push(`role = $${i++}`); vals.push(role); }
    if (is_active !== undefined) { sets.push(`is_active = $${i++}`); vals.push(Boolean(is_active)); }
    if (password) { sets.push(`password_hash = $${i++}`); vals.push(await bcrypt.hash(password, 10)); }
    if (restaurant_id !== undefined && req.user.role === 'super_admin') { sets.push(`restaurant_id = $${i++}`); vals.push(Number(restaurant_id)); }
    if (!sets.length) return res.status(400).json({ error: 'No fields to update' });
    vals.push(userId);
    const user = await queryOne(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${i} RETURNING id, name, email, role, is_active, created_at`,
      vals
    );
    res.json(user);
  } catch (err) {
    console.error('[updateUser]', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function updateUserStatus(req, res) {
  try {
    const userId = Number(req.params.id);
    const { is_active } = req.body;
    if (is_active === undefined) return res.status(400).json({ error: 'is_active required' });
    const whereClause = req.user.role === 'super_admin'
      ? `WHERE id = $2`
      : `WHERE id = $2 AND restaurant_id = $3`;
    const params = req.user.role === 'super_admin'
      ? [Boolean(is_active), userId]
      : [Boolean(is_active), userId, Number(getRestaurantId(req))];
    const user = await queryOne(
      `UPDATE users SET is_active = $1 ${whereClause} RETURNING id, name, email, role, is_active, created_at`,
      params
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('[updateUserStatus]', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function deleteUser(req, res) {
  try {
    const userId = Number(req.params.id);
    let target;
    if (req.user.role === 'super_admin') {
      target = await queryOne('SELECT role FROM users WHERE id = $1', [userId]);
    } else {
      const rid = Number(getRestaurantId(req));
      target = await queryOne('SELECT role FROM users WHERE id = $1 AND restaurant_id = $2', [userId, rid]);
    }
    if (!target) return res.status(404).json({ error: 'User not found' });
    const allowed = CAN_CREATE_ROLE[req.user.role] || [];
    if (!allowed.includes(target.role)) return res.status(403).json({ error: 'Cannot delete this user' });
    const whereClause = req.user.role === 'super_admin' ? 'WHERE id = $1' : 'WHERE id = $1 AND restaurant_id = $2';
    const params = req.user.role === 'super_admin' ? [userId] : [userId, Number(getRestaurantId(req))];
    await query(`DELETE FROM users ${whereClause}`, params);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('[deleteUser]', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function resetPassword(req, res) {
  try {
    const userId = Number(req.params.id);
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'password required' });
    let target;
    if (req.user.role === 'super_admin') {
      target = await queryOne('SELECT role FROM users WHERE id = $1', [userId]);
    } else {
      const rid = Number(getRestaurantId(req));
      target = await queryOne('SELECT role FROM users WHERE id = $1 AND restaurant_id = $2', [userId, rid]);
    }
    if (!target) return res.status(404).json({ error: 'User not found' });
    const allowed = CAN_CREATE_ROLE[req.user.role] || [];
    if (!allowed.includes(target.role)) return res.status(403).json({ error: 'Cannot reset password for this user' });
    const hash = await bcrypt.hash(password, 10);
    const whereClause = req.user.role === 'super_admin' ? 'WHERE id = $2' : 'WHERE id = $2 AND restaurant_id = $3';
    const params = req.user.role === 'super_admin' ? [hash, userId] : [hash, userId, Number(getRestaurantId(req))];
    await query(`UPDATE users SET password_hash = $1 ${whereClause}`, params);
    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error('[resetPassword]', err.message);
    res.status(500).json({ error: err.message });
  }
}
