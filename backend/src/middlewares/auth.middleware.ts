import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de autenticación por API-KEY para rutas de administración.
 * La clave se configura en .env como ADMIN_API_KEY.
 * Uso desde el cliente:  Authorization: Bearer <ADMIN_API_KEY>
 */
export const requireAdminKey = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Acceso no autorizado — falta API key' });
    return;
  }

  const provided = authHeader.slice(7);
  const expected = process.env.ADMIN_API_KEY;

  if (!expected || provided !== expected) {
    res.status(403).json({ error: 'API key inválida' });
    return;
  }

  next();
};
