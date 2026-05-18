import { Router } from 'express';
import { query, queryOne } from '../config/database.js';
import { createWavePayment, verifyWavePayment, handleWaveWebhook } from '../services/waveService.js';
import auth from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roles.js';

const router = Router();

router.post('/create', auth, async (req, res) => {
  try {
    const { amount, phone, orderId } = req.body;
    if (!amount || !phone || !orderId) {
      return res.status(400).json({ error: 'Montant, téléphone et commande requis' });
    }
    const result = await createWavePayment({ amount, phone, orderId });
    if (!result.success) {
      return res.status(502).json({ error: result.error || 'Erreur paiement Wave' });
    }
    await query(
      `UPDATE payments SET provider = 'wave', provider_payment_id = $1 WHERE order_id = $2`,
      [result.provider_payment_id, orderId]
    );
    res.json(result);
  } catch (err) {
    console.error('[Wave] create error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-wave-signature'];
    const result = await handleWaveWebhook(req.body, signature);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    if (result.provider_payment_id) {
      const payment = await queryOne(
        'SELECT order_id FROM payments WHERE provider_payment_id = $1', [result.provider_payment_id]
      );
      if (payment) {
        await query(
          `UPDATE payments SET status = $1, paid_at = NOW() WHERE provider_payment_id = $2`,
          [result.status, result.provider_payment_id]
        );
        if (result.status === 'paid') {
          await query(
            `UPDATE orders SET payment_status = 'paid' WHERE id = $1`,
            [payment.order_id]
          );
          try {
            req.app.get('io').emit('payment_updated', { orderId: payment.order_id, status: 'paid' });
          } catch {}
        }
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('[Wave] webhook error:', err.message);
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
    const result = await verifyWavePayment(payment.provider_payment_id);
    res.json(result);
  } catch (err) {
    console.error('[Wave] status error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
