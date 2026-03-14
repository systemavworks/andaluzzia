import { Router } from 'express';
import { crearReserva, getReservas, actualizarEstadoReserva } from '../controllers/reservaController';

const router = Router();
router.post('/',            crearReserva);
router.get('/',             getReservas);
router.put('/:id/estado',   actualizarEstadoReserva);
export default router;
