import { Router } from 'express';
import { getUsers, createUser, updateUser, updateUserStatus, deleteUser, resetPassword } from '../controllers/userController.js';
import auth from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roles.js';

const router = Router();

router.get('/', auth, requireRole('admin', 'super_admin'), getUsers);
router.post('/', auth, requireRole('admin', 'super_admin'), createUser);
router.put('/:id', auth, requireRole('admin', 'super_admin'), updateUser);
router.patch('/:id/status', auth, requireRole('admin', 'super_admin'), updateUserStatus);
router.patch('/:id/password', auth, requireRole('admin', 'super_admin'), resetPassword);
router.delete('/:id', auth, requireRole('admin', 'super_admin'), deleteUser);

export default router;
