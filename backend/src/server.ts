import 'dotenv/config';
import app from './app';
import { connectDB } from './config/database';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3001;
const ALLOW_START_WITHOUT_DB = process.env.ALLOW_START_WITHOUT_DB === 'true';

const startServer = async () => {
  try {
    try {
      await connectDB();   // verifica conectividad con Supabase
    } catch (error) {
      if (!ALLOW_START_WITHOUT_DB) throw error;
      const msg = error instanceof Error ? error.message : String(error);
      logger.warn(`Conectividad DB no disponible, arrancando en modo degradado: ${msg}`);
    }

    app.listen(PORT, () => {
      logger.info(`Servidor Andaluzzia corriendo en puerto ${PORT}`);
      logger.info(`Frontend permitido: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      if (ALLOW_START_WITHOUT_DB) {
        logger.warn('Modo degradado activo (ALLOW_START_WITHOUT_DB=true). Rutas con BD pueden fallar hasta configurar credenciales reales.');
      }
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`Error iniciando servidor: ${msg}`);
    process.exit(1);
  }
};

startServer();
