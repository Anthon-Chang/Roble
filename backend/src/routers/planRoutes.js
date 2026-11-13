import express from "express"
import { getPlans, getPlanById, createPlan, updatePlan, deletePlan } from "../controllers/planController.js"
import { verificarTokenJWT } from "../middlewares/JWT.js"
import { permitirRoles, aprobadoSiEsCarpintero } from "../middlewares/roles.js"
import { subidaArchivos } from "../middlewares/subida.js"

const router = express.Router()

// Lectura pública (catálogo de planos)
router.get("/", getPlans)
router.get("/:id", getPlanById)

// Escritura: administradores y carpinteros aprobados. La propiedad del plano (solo su creador o un
// administrador puede modificarlo o borrarlo) se valida en el controlador.
// El archivo viaja en el campo "image".
const gestion = [verificarTokenJWT, permitirRoles("carpintero", "administrador"), aprobadoSiEsCarpintero]
router.post("/", ...gestion, subidaArchivos, createPlan)
router.put("/:id", ...gestion, subidaArchivos, updatePlan)
router.delete("/:id", ...gestion, deletePlan)

export default router
