import { Router } from "express"
import { registrarEstado, eliminarEstado, pagarEstado } from "../controllers/estado_controller.js"
import { verificarTokenJWT } from "../middlewares/JWT.js"
import { permitirRoles, carpinteroAprobado } from "../middlewares/roles.js"

const router = Router()

// Registrar y eliminar estados: solo el carpintero aprobado dueño del proyecto
router.post("/registro", verificarTokenJWT, carpinteroAprobado, registrarEstado)
router.delete("/eliminar/:id", verificarTokenJWT, carpinteroAprobado, eliminarEstado)

// Pagar un estado: solo el cliente dueño del proyecto
router.post("/pagar", verificarTokenJWT, permitirRoles("cliente"), pagarEstado)

export default router
