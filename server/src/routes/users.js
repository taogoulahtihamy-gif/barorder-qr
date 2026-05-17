import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/userController.js';
import auth from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roles.js';

const router = Router();

router.get('/', auth, requireRole('admin', 'super_admin', 'manager'), getUsers);
router.post('/', auth, requireRole('admin', 'super_admin', 'manager'), createUser);
router.put('/:id', auth, requireRole('admin', 'super_admin', 'manager'), updateUser);
router.delete('/:id', auth, requireRole('admin', 'super_admin'), deleteUser);

export default router;
