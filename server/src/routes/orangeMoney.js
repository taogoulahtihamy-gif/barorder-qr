import { Router } from 'express';
import { query, queryOne } from '../config/database.js';
import { createOrangePayment, verifyOrangePayment } from '../services/orangeMoneyService.js';
import auth from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roles.js';

const router = Router();

router.post('/create', auth, async (req, res) => {
  try {
    const { amount, phone, orderId } = req.body;
    if (!amount || !phone || !orderId) {
      return res.status(400).json({ error: 'Montant, téléphone et commande requis' });
    }
    const result = await createOrangePayment({ amount, phone, orderId });
    if (!result.success) {
      return res.status(502).json({ error: result.error || 'Erreur paiement Orange Money' });
    }
    await query(
      `UPDATE payments SET provider = 'orange_money', provider_payment_id = $1 WHERE order_id = $2`,
      [result.provider_payment_id, orderId]
    );
    res.json(result);
  } catch (err) {
    console.error('[OrangeMoney] create error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/status/:id', auth, async (req, res) => {
  try {
    const payment = await queryOne(
      'SELECT provider_payment_id FROM payments WHERE order_id = $1', [req.params.id]
    );
    if (!payment || !payment.provider_payment_id) {
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }
    const result = await verifyOrangePayment(payment.provider_payment_id);
    res.json(result);
  } catch (err) {
    console.error('[OrangeMoney] status error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
