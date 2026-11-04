import { Router } from "express"
import { registrarEstado, eliminarEstado, pagarEstado } from "../controllers/estado_controller.js"
import { verificarTokenJWT } from "../middlewares/JWT.js"
import { permitirRoles } from "../middlewares/roles.js"

const router = Router()

// Registrar y eliminar estados: solo el carpintero dueño del proyecto
router.post("/registro", verificarTokenJWT, permitirRoles("carpintero"), registrarEstado)
router.delete("/eliminar/:id", verificarTokenJWT, permitirRoles("carpintero"), eliminarEstado)

// Pagar un estado: solo el cliente dueño del proyecto
router.post("/pagar", verificarTokenJWT, permitirRoles("cliente"), pagarEstado)

export default router
