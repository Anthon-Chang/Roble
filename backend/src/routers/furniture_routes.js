
import { Router } from 'express';
import { getAllFurniture, getFurnitureById } from '../controllers/furniture_controller.js'; 
const router = Router();

// Ruta para obtener todos los muebles (ej: GET /api/v1/furniture-api-proxy)
router.get('/', getAllFurniture);

// Ruta para obtener un mueble por ID (ej: GET /api/v1/furniture-api-proxy/123)
router.get('/:id', getFurnitureById);

export default router;