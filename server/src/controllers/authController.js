import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { queryOne } from '../config/database.js';

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }
    const user = await queryOne(`
      SELECT u.*, r.slug as restaurant_slug, r.name as restaurant_name
      FROM users u
      LEFT JOIN restaurants r ON r.id = u.restaurant_id
      WHERE u.email = $1
    `, [email]);
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    if (user.is_active === false) {
      return res.status(403).json({ error: 'Compte désactivé' });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, restaurant_id: user.restaurant_id },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
    const { password_hash, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function me(req, res) {
  try {
    const user = await queryOne(`
      SELECT u.id, u.name, u.email, u.role, u.restaurant_id, u.is_active, u.created_at,
             r.name as restaurant_name, r.slug as restaurant_slug, r.logo_url as restaurant_logo,
             r.primary_color as restaurant_color, r.currency as restaurant_currency
      FROM users u
      LEFT JOIN restaurants r ON r.id = u.restaurant_id
      WHERE u.id = $1
    `, [req.user.id]);
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}