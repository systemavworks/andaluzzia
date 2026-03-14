import { Router } from 'express';
import { getPlatos, getPlatoById, createPlato, updatePlato, deletePlato } from '../controllers/menuController';
import { upload }             from '../config/cloudinary';
import { requireAdminKey }    from '../middlewares/auth.middleware';
import { validate }           from '../middlewares/validate.middleware';
import { generalLimiter }     from '../middlewares/rateLimit.middleware';
import { platoValidators }    from '../utils/validators';

const router = Router();

// Rutas públicas
router.get('/',    generalLimiter, getPlatos);
router.get('/:id', generalLimiter, getPlatoById);

// Rutas de administración — requieren API key
router.post('/',    requireAdminKey, upload.single('imagen'), platoValidators, validate, createPlato);
router.put('/:id',  requireAdminKey, upload.single('imagen'), platoValidators, validate, updatePlato);
router.delete('/:id', requireAdminKey, deletePlato);

export default router;
