import { Router } from 'express';
import { getTable, getMenu, getMenuBySlug, createOrder, getOrderByNumber, callServer, getRestaurantBySlug, getRestaurants } from '../controllers/publicController.js';
import { getPublicPromotions } from '../controllers/promotionController.js';

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
router.get('/r/:slug/promotions', getPublicPromotions);

export default router;