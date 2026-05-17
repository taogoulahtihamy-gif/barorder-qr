import { Router } from 'express';
import { getProducts, createProduct, updateProduct, deleteProduct, toggleAvailability } from '../controllers/productController.js';
import auth from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', auth, getProducts);
router.post('/', auth, createProduct);
router.put('/:id', auth, updateProduct);
router.delete('/:id', auth, deleteProduct);
router.patch('/:id/availability', auth, toggleAvailability);

export default router;
