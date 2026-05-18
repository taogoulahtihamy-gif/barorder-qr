import config from '../config/index.js';

const SIMULATED_DELAY = 1500;

function generateRef() {
  return `WAVE-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function createWavePayment({ amount, currency, phone, description, orderId }) {
  console.log('[WaveService] createWavePayment:', { amount, currency, phone, orderId });

  if (!config.waveApiKey || config.waveApiKey === 'test') {
    console.log('[WaveService] Simulation mode - creating fake payment');
    await new Promise(r => setTimeout(r, SIMULATED_DELAY));
    const ref = generateRef();
    return {
      success: true,
      provider_payment_id: ref,
      status: 'pending',
      message: 'Paiement Wave initié (simulation)',
      amount,
      currency: currency || 'XOF',
    };
  }

  try {
    const response = await fetch(`${config.waveBaseUrl}/v1/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.waveApiKey}`,
      },
      body: JSON.stringify({
        amount: { currency: currency || 'XOF', value: amount },
        description: description || `Commande #${orderId}`,
        client: { phone },
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Wave API error');
    return {
      success: true,
      provider_payment_id: data.id,
      status: data.status || 'pending',
      message: 'Paiement Wave initié',
      checkout_url: data.checkout_url,
    };
  } catch (err) {
    console.error('[WaveService] createWavePayment error:', err.message);
    return { success: false, error: err.message };
  }
}

export async function verifyWavePayment(providerPaymentId) {
  console.log('[WaveService] verifyWavePayment:', providerPaymentId);

  if (!config.waveApiKey || config.waveApiKey === 'test') {
    await new Promise(r => setTimeout(r, 800));
    return {
      success: true,
      status: 'paid',
      message: 'Paiement Wave vérifié (simulation)',
    };
  }

  try {
    const response = await fetch(`${config.waveBaseUrl}/v1/checkout/${providerPaymentId}`, {
      headers: { 'Authorization': `Bearer ${config.waveApiKey}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Wave verification error');
    return {
      success: true,
      status: data.status,
      message: data.status === 'completed' ? 'Paiement confirmé' : 'En attente',
    };
  } catch (err) {
    console.error('[WaveService] verifyWavePayment error:', err.message);
    return { success: false, error: err.message, status: 'failed' };
  }
}

export async function handleWaveWebhook(payload, signature) {
  console.log('[WaveService] handleWaveWebhook');

  if (!config.waveWebhookSecret || config.waveWebhookSecret === 'test') {
    console.log('[WaveService] Webhook simulation mode');
    return { success: true, status: payload?.event === 'payment.completed' ? 'paid' : 'pending' };
  }

  const crypto = await import('crypto');
  const expectedSig = crypto
    .createHmac('sha256', config.waveWebhookSecret)
    .update(JSON.stringify(payload))
    .digest('hex');

  if (signature !== expectedSig) {
    console.warn('[WaveService] Invalid webhook signature');
    return { success: false, error: 'Invalid signature' };
  }

  const status = payload?.event === 'payment.completed' ? 'paid' : 'pending';
  return { success: true, status, provider_payment_id: payload?.id };
}
