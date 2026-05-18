import config from '../config/index.js';

const SIMULATED_DELAY = 1500;

function generateRef() {
  return `OM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function createOrangePayment({ amount, phone, description, orderId }) {
  console.log('[OrangeMoneyService] createOrangePayment:', { amount, phone, orderId });

  if (!config.omApiKey || config.omApiKey === 'test') {
    console.log('[OrangeMoneyService] Simulation mode');
    await new Promise(r => setTimeout(r, SIMULATED_DELAY));
    const ref = generateRef();
    return {
      success: true,
      provider_payment_id: ref,
      status: 'pending',
      message: 'Paiement Orange Money initié (simulation)',
      amount,
      currency: 'XOF',
    };
  }

  try {
    const tokenResponse = await fetch(`${config.omBaseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: config.omApiKey,
      }),
    });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) throw new Error('OM auth failed');

    const response = await fetch(`${config.omBaseUrl}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`,
        'X-API-Key': config.omApiKey,
      },
      body: JSON.stringify({
        merchant_key: config.omMerchantKey,
        amount: { unit: 'XOF', value: amount },
        reference: `ORDER-${orderId}-${Date.now()}`,
        description: description || `Commande #${orderId}`,
        subscriber_number: phone,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'OM API error');
    return {
      success: true,
      provider_payment_id: data.pay_token || data.id,
      status: data.status || 'pending',
      message: 'Paiement Orange Money initié',
    };
  } catch (err) {
    console.error('[OrangeMoneyService] createOrangePayment error:', err.message);
    return { success: false, error: err.message };
  }
}

export async function verifyOrangePayment(providerPaymentId) {
  console.log('[OrangeMoneyService] verifyOrangePayment:', providerPaymentId);

  if (!config.omApiKey || config.omApiKey === 'test') {
    await new Promise(r => setTimeout(r, 800));
    return {
      success: true,
      status: 'paid',
      message: 'Paiement Orange Money vérifié (simulation)',
    };
  }

  try {
    const tokenResponse = await fetch(`${config.omBaseUrl}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: config.omApiKey,
      }),
    });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) throw new Error('OM auth failed');

    const response = await fetch(`${config.omBaseUrl}/payment/${providerPaymentId}`, {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'OM verification error');
    return {
      success: true,
      status: data.status,
      message: data.status === 'completed' ? 'Paiement confirmé' : 'En attente',
    };
  } catch (err) {
    console.error('[OrangeMoneyService] verifyOrangePayment error:', err.message);
    return { success: false, error: err.message, status: 'failed' };
  }
}
