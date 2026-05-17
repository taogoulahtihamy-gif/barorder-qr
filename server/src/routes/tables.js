import { Router } from 'express';
import { getTables, createTable, deleteTable, generateTableQR, getPrintableQR } from '../controllers/tableController.js';
import auth from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roles.js';

const router = Router();

router.get('/', auth, requireRole('admin', 'super_admin', 'manager', 'waiter'), getTables);
router.post('/', auth, requireRole('admin', 'super_admin', 'manager', 'waiter'), createTable);
router.delete('/:id', auth, requireRole('admin', 'super_admin', 'manager'), deleteTable);
router.post('/:id/generate-qr', auth, requireRole('admin', 'super_admin', 'manager'), generateTableQR);
router.get('/printable', auth, requireRole('admin', 'super_admin', 'manager'), getPrintableQR);

export default router;
