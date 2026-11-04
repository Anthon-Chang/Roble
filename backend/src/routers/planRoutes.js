import express from "express"
import { getPlans, getPlanById, createPlan, updatePlan, deletePlan } from "../controllers/planController.js"
import { verificarTokenJWT } from "../middlewares/JWT.js"
import { permitirRoles } from "../middlewares/roles.js"

const router = express.Router()

// Lectura pública
router.get("/", getPlans)
router.get("/:id", getPlanById)

// Escritura: solo carpinteros y administradores (el archivo viaja en el campo "image")
const gestion = [verificarTokenJWT, permitirRoles("carpintero", "administrador")]
router.post("/", ...gestion, createPlan)
router.put("/:id", ...gestion, updatePlan)
router.delete("/:id", ...gestion, deletePlan)

export default router
