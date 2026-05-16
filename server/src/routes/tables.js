import { Router } from 'express';
import { getTables, createTable, deleteTable, generateTableQR, getPrintableQR } from '../controllers/tableController.js';
import auth from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', auth, getTables);
router.post('/', auth, createTable);
router.delete('/:id', auth, deleteTable);
router.post('/:id/generate-qr', auth, generateTableQR);
router.get('/printable', auth, getPrintableQR);

export default router;
