import express       from 'express';
import cors          from 'cors';
import helmet        from 'helmet';
import menuRoutes    from './routes/menu.routes';
import reservaRoutes from './routes/reservas.routes';
import mesaRoutes    from './routes/mesas.routes';
import chatRoutes    from './routes/chat.routes';
import { generalLimiter } from './middlewares/rateLimit.middleware';
import { logger }    from './utils/logger';

const app = express();

// ── Seguridad ──────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// ── Parsers ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rutas ──────────────────────────────────────────────────────────────────
app.use('/api/menu',     menuRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/mesas',    generalLimiter, mesaRoutes);
app.use('/api/chat',     chatRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error handler ──────────────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(err.stack || err.message);
  res.status(500).json({ error: 'Algo salió mal — el Curro está investigando.' });
});

export default app;
