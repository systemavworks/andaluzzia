import { Router }       from 'express';
import { Mesa }          from '../models/Mesa';
import { requireAdminKey } from '../middlewares/auth.middleware';

const router = Router();

/** Devuelve todas las mesas activas (público — para el maitre y reservas) */
router.get('/', async (_req, res) => {
  try {
    const mesas = await Mesa.find({ activa: true }).sort({ zona: 1, numero: 1 });
    res.json(mesas);
  } catch {
    res.status(500).json({ error: 'Error obteniendo mesas' });
  }
});

/** Crear mesa (solo admin) */
router.post('/', requireAdminKey, async (req, res) => {
  try {
    const mesa = new Mesa(req.body);
    await mesa.save();
    res.status(201).json(mesa);
  } catch {
    res.status(500).json({ error: 'Error creando mesa' });
  }
});

/** Actualizar mesa (solo admin) */
router.put('/:id', requireAdminKey, async (req, res) => {
  try {
    const mesa = await Mesa.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!mesa) { res.status(404).json({ error: 'Mesa no encontrada' }); return; }
    res.json(mesa);
  } catch {
    res.status(500).json({ error: 'Error actualizando mesa' });
  }
});

export default router;
