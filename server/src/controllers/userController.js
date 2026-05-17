import bcrypt from 'bcrypt';
import { query, queryOne } from '../config/database.js';
import { getRestaurantId } from '../utils/restaurantId.js';

const VALID_ROLES = ['super_admin', 'manager', 'waiter', 'kitchen', 'cashier'];

export async function getUsers(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    const users = await query(`
      SELECT id, name, email, role, is_active, created_at
      FROM users
      WHERE restaurant_id = $1
      ORDER BY created_at DESC
    `, [rid]);
    res.json(users);
  } catch (err) {
    console.error('[getUsers] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function createUser(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Nom, email, mot de passe et rôle requis' });
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Rôle invalide' });
    }
    if (role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Seul un super_admin peut créer un super_admin' });
    }
    const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await queryOne(`
      INSERT INTO users (restaurant_id, name, email, password_hash, role, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING id, name, email, role, is_active, created_at
    `, [rid, name, email, passwordHash, role]);
    res.status(201).json(user);
  } catch (err) {
    console.error('[createUser] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function updateUser(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    const userId = Number(req.params.id);
    const { name, email, password, role, is_active } = req.body;
    const existing = await queryOne('SELECT * FROM users WHERE id = $1 AND restaurant_id = $2', [userId, rid]);
    if (!existing) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    if (role && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Rôle invalide' });
    }
    if (role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Seul un super_admin peut attribuer le rôle super_admin' });
    }
    const updateFields = [];
    const params = [];
    let idx = 1;
    if (name !== undefined) { updateFields.push(`name = $${idx++}`); params.push(name); }
    if (email !== undefined) { updateFields.push(`email = $${idx++}`); params.push(email); }
    if (role !== undefined) { updateFields.push(`role = $${idx++}`); params.push(role); }
    if (is_active !== undefined) { updateFields.push(`is_active = $${idx++}`); params.push(is_active); }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      updateFields.push(`password_hash = $${idx++}`);
      params.push(hash);
    }
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
    }
    params.push(userId);
    params.push(rid);
    const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${idx++} AND restaurant_id = $${idx} RETURNING id, name, email, role, is_active, created_at`;
    const user = await queryOne(sql, params);
    res.json(user);
  } catch (err) {
    console.error('[updateUser] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function deleteUser(req, res) {
  try {
    const rid = Number(getRestaurantId(req));
    const userId = Number(req.params.id);
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas vous supprimer vous-même' });
    }
    await query('DELETE FROM users WHERE id = $1 AND restaurant_id = $2', [userId, rid]);
    res.json({ message: 'Utilisateur supprimé' });
  } catch (err) {
    console.error('[deleteUser] error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
