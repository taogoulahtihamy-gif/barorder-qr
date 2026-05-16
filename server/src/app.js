import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes/index.js';
import errorHandler from './middlewares/errorMiddleware.js';
import config from './config/index.js';

const app = express();

app.use(cors({ origin: config.clientUrl }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/api', routes);

app.use(errorHandler);

export default app;
