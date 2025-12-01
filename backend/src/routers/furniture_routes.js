import { Router } from 'express';
import { getAllFurniture, getFurnitureById } from '../controllers/furniture_controller.js';

const router = Router();

router.get('/', getAllFurniture);     // GET /api/v1/furniture-api-proxy
router.get('/:id', getFurnitureById); // GET /api/v1/furniture-api-proxy/:id

export default router;

