import { Router } from 'express';
import { crearReserva, getReservas, actualizarEstadoReserva } from '../controllers/reservaController';
import { requireAdminKey }   from '../middlewares/auth.middleware';
import { validate }          from '../middlewares/validate.middleware';
import { reservasLimiter }   from '../middlewares/rateLimit.middleware';
import { reservaValidators } from '../utils/validators';

const router = Router();

// Ruta pública con límite anti-spam y validación
router.post('/',           reservasLimiter, reservaValidators, validate, crearReserva);

// Rutas de administración
router.get('/',            requireAdminKey, getReservas);
router.put('/:id/estado',  requireAdminKey, actualizarEstadoReserva);

export default router;
