import { Router }         from 'express';
import { supabase }       from '../config/supabase';
import { requireAdminKey } from '../middlewares/auth.middleware';

const router = Router();

/** Mesas activas (público — para el maitre y reservas) */
router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('mesas').select('*').eq('activa', true).order('zona').order('numero');
    if (error) throw error;
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Error obteniendo mesas' });
  }
});

/** Crear mesa (solo admin) */
router.post('/', requireAdminKey, async (req, res) => {
  try {
    const { data, error } = await supabase.from('mesas').insert(req.body).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch {
    res.status(500).json({ error: 'Error creando mesa' });
  }
});

/** Actualizar mesa (solo admin) */
router.put('/:id', requireAdminKey, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('mesas').update(req.body).eq('id', req.params.id).select().single();
    if (!data || error) { res.status(404).json({ error: 'Mesa no encontrada' }); return; }
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Error actualizando mesa' });
  }
});

export default router;
