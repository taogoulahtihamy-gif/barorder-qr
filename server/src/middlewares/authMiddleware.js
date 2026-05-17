import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { queryOne } from '../config/database.js';

export default async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token non fourni' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await queryOne('SELECT id, name, email, role, restaurant_id, is_active FROM users WHERE id = $1', [decoded.id]);
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }
    if (user.is_active === false) {
      return res.status(403).json({ error: 'Compte désactivé' });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }
    return res.status(500).json({ error: err.message });
  }
}
