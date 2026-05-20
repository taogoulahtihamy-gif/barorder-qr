import { Router } from 'express';
import { getRestaurants, getRestaurant, createRestaurant, updateRestaurant, updateRestaurantStatus } from '../controllers/restaurantController.js';
import auth from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roles.js';

const router = Router();

router.get('/', auth, requireRole('super_admin'), getRestaurants);
router.get('/:id', auth, requireRole('super_admin'), getRestaurant);
router.post('/', auth, requireRole('super_admin'), createRestaurant);
router.put('/:id', auth, requireRole('super_admin'), updateRestaurant);
router.patch('/:id/status', auth, requireRole('super_admin'), updateRestaurantStatus);

export default router;
