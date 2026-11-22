import { Router } from "express"
import { enviarPropuesta, listarPropuestas, aprobarPropuesta, rechazarPropuesta } from "../controllers/propuesta_controller.js"
import { verificarTokenJWT } from "../middlewares/JWT.js"
import { permitirRoles, carpinteroAprobado, aprobadoSiEsCarpintero } from "../middlewares/roles.js"
import { subidaArchivos } from "../middlewares/subida.js"

const router = Router()

// Enviar una propuesta de diseño 3D (HU-011): solo el carpintero aprobado dueño del proyecto
router.post("/registro", verificarTokenJWT, carpinteroAprobado, subidaArchivos, enviarPropuesta)

// Consultar las propuestas de un proyecto: el carpintero dueño, el cliente dueño o el administrador
router.get("/proyecto/:proyectoId", verificarTokenJWT, aprobadoSiEsCarpintero, listarPropuestas)

// Aprobar o rechazar un modelo propuesto (HU-012): solo el cliente dueño del proyecto
router.put("/aprobar/:id", verificarTokenJWT, permitirRoles("cliente"), aprobarPropuesta)
router.put("/rechazar/:id", verificarTokenJWT, permitirRoles("cliente"), rechazarPropuesta)

export default router
