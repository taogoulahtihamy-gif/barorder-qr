import 'dotenv/config';

export default {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  publicAppUrl: process.env.PUBLIC_APP_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/barorder_qr',
  waveApiKey: process.env.WAVE_API_KEY || 'test',
  waveBaseUrl: process.env.WAVE_BASE_URL || 'https://api.wave.com',
  waveWebhookSecret: process.env.WAVE_WEBHOOK_SECRET || 'test',
  omApiKey: process.env.OM_API_KEY || 'test',
  omMerchantKey: process.env.OM_MERCHANT_KEY || 'test',
  omBaseUrl: process.env.OM_BASE_URL || 'https://api.orange.com',
};
