import { Router } from "express";
import { getAllModels, createModel } from "../controllers/model3d_controller.js";

const router = Router();

router.get("/", getAllModels);     // Obtener todos
router.post("/", createModel);     // Crear nuevo

export default router;
