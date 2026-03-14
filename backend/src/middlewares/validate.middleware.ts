import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Ejecutar tras las cadenas de express-validator.
 * Si hay errores los devuelve como 422 con detalle por campo.
 */
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({
      error:  'Datos de entrada inválidos',
      fields: errors.array().map(e => ({ field: (e as any).path, msg: e.msg })),
    });
    return;
  }
  next();
};
