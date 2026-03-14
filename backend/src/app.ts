import express from 'express';
import cors from 'cors';
import menuRoutes   from './routes/menu.routes';
import reservaRoutes from './routes/reservas.routes';

const app = express();

app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/menu',     menuRoutes);
app.use('/api/reservas', reservaRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal!' });
});

export default app;
