import { Router } from "express"
import { registrarEstado, eliminarEstado, pagarEstado } from "../controllers/estado_controller.js"
import { verificarTokenJWT } from "../middlewares/JWT.js"

const router = Router()

// ===============================
// REGISTRAR ESTADO DE UN PROYECTO
// ===============================
router.post("/registro", verificarTokenJWT, registrarEstado)

// ===============================
// ELIMINAR ESTADO DE UN PROYECTO
// ===============================
router.delete("/eliminar/:id", verificarTokenJWT, eliminarEstado)

// ===============================
// PAGAR ESTADO DE UN PROYECTO
// ===============================
router.post("/pagar", verificarTokenJWT, pagarEstado)

export default router
