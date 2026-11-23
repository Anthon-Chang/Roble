import { Router } from "express"
import { historialMensajes, resumenChats } from "../controllers/mensaje_controller.js"
import { verificarTokenJWT } from "../middlewares/JWT.js"
import { permitirRoles } from "../middlewares/roles.js"

const router = Router()

// Resumen (último mensaje por proyecto, para el badge de "Mensajes" del dashboard)
router.get("/resumen", verificarTokenJWT, permitirRoles("carpintero", "cliente"), resumenChats)

// Historial completo de un proyecto (carga inicial del chat)
router.get("/:proyectoId", verificarTokenJWT, permitirRoles("carpintero", "cliente", "administrador"), historialMensajes)

export default router
