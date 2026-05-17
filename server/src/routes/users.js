import { Router } from 'express';
import { getUsers, createUser } from '../controllers/userController.js';
import auth from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', auth, getUsers);
router.post('/', auth, createUser);

export default router;
