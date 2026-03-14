import { body } from 'express-validator';

/** Validadores para el formulario de reserva */
export const reservaValidators = [
  body('nombre')
    .trim().notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ max: 100 }).withMessage('Nombre demasiado largo'),

  body('email')
    .trim().normalizeEmail().isEmail().withMessage('Email inválido'),

  body('telefono')
    .trim().notEmpty().withMessage('El teléfono es obligatorio')
    .matches(/^[6-9]\d{8}$/).withMessage('Teléfono español no válido (9 dígitos, empieza por 6-9)'),

  body('personas')
    .isInt({ min: 1, max: 20 }).withMessage('El número de personas debe estar entre 1 y 20'),

  body('fecha')
    .isISO8601().withMessage('Fecha inválida')
    .custom((value) => {
      const fecha = new Date(value);
      const hoy   = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (fecha < hoy) throw new Error('La fecha no puede ser en el pasado');
      return true;
    }),

  body('hora')
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Hora inválida (formato HH:MM)')
    .custom((value) => {
      const [h] = value.split(':').map(Number);
      if (h < 12 || h > 23) throw new Error('Horario disponible: 12:00–00:00');
      return true;
    }),

  body('notas')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Las notas no pueden superar 500 caracteres'),
];

/** Validadores para crear/actualizar platos (solo admin) */
export const platoValidators = [
  body('nombre').trim().notEmpty().withMessage('Nombre requerido').isLength({ max: 120 }),
  body('descripcion').trim().notEmpty().withMessage('Descripción requerida').isLength({ max: 500 }),
  body('precio').isFloat({ min: 0.5, max: 500 }).withMessage('Precio inválido'),
  body('categoria')
    .isIn(['tapas', 'raciones', 'postres', 'bebidas', 'especiales'])
    .withMessage('Categoría no válida'),
  body('alergenos').optional().isArray(),
];
