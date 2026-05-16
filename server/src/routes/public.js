import { Router } from 'express';
import { getTable, getMenu, getMenuBySlug, createOrder, getOrderByNumber, callServer, getRestaurantBySlug, getRestaurants } from '../controllers/publicController.js';

const router = Router();

router.get('/restaurants', getRestaurants);
router.get('/restaurant/:slug', getRestaurantBySlug);
router.get('/table/:tableId', getTable);
router.get('/menu/:restaurantId', getMenu);
router.post('/orders', createOrder);
router.get('/orders/:orderNumber', getOrderByNumber);
router.post('/server-call', callServer);

router.get('/r/:slug/menu', getMenuBySlug);
router.get('/r/:slug/menu/:tableId', getMenuBySlug);

export default router;