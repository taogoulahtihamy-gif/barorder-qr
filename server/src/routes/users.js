import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/userController.js';
import auth from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roles.js';

const router = Router();

router.get('/', auth, requireRole('admin', 'super_admin'), getUsers);
router.post('/', auth, requireRole('admin', 'super_admin'), createUser);
router.put('/:id', auth, requireRole('admin', 'super_admin'), updateUser);
router.delete('/:id', auth, requireRole('admin', 'super_admin'), deleteUser);

export default router;
