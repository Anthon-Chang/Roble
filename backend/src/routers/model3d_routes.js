import { Router } from "express";
import { getAllModels, createModel, searchModelByName } from "../controllers/model3d_controller.js";

const router = Router();

router.get("/", getAllModels);     // Obtener todos
router.post("/", createModel);     // Crear nuevo
router.get("/search", searchModelByName);
export default router;
