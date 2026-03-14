import 'dotenv/config';
import app from './app';
import { connectDB } from './config/database';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await connectDB();   // verifica conectividad con Supabase
    app.listen(PORT, () => {
      logger.info(`Servidor Andaluzzia corriendo en puerto ${PORT}`);
      logger.info(`Frontend permitido: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });
  } catch (error) {
    logger.error('Error iniciando servidor', { error });
    process.exit(1);
  }
};

startServer();
