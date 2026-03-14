import { Router } from 'express';
import { getPlatos, getPlatoById, createPlato, updatePlato, deletePlato } from '../controllers/menuController';
import { upload } from '../config/cloudinary';

const router = Router();
router.get('/',    getPlatos);
router.get('/:id', getPlatoById);
router.post('/',   upload.single('imagen'), createPlato);
router.put('/:id', upload.single('imagen'), updatePlato);
router.delete('/:id', deletePlato);
export default router;
