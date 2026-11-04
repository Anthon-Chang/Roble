import { Router } from 'express'
import {
    registrarProyecto,
    solicitarProyecto,
    listarProyectos,
    listarRequerimientos,
    detalleProyecto,
    eliminarProyecto,
    actualizarProyecto
} from '../controllers/proyecto_controller.js'
import { loginClienteProyecto, perfilClienteProyecto } from '../controllers/cliente_controller.js'
import { verificarTokenJWT } from '../middlewares/JWT.js'
import { permitirRoles, carpinteroAprobado } from '../middlewares/roles.js'

const router = Router()

// Acceso del cliente (compatibilidad con el frontend actual; la cuenta vive en /api/cliente)
router.post("/login", loginClienteProyecto)
router.get("/perfil", verificarTokenJWT, permitirRoles("cliente"), perfilClienteProyecto)

// Crear proyecto
router.post("/solicitar", verificarTokenJWT, permitirRoles("cliente"), solicitarProyecto) // HU-010
router.post("/registro", verificarTokenJWT, carpinteroAprobado, registrarProyecto)

// Consultar
router.get("/listar", verificarTokenJWT, permitirRoles("carpintero", "cliente", "administrador"), listarProyectos)
router.get("/requerimientos", verificarTokenJWT, permitirRoles("carpintero"), listarRequerimientos) // HU-011
router.get("/requerimientos/:id", verificarTokenJWT, permitirRoles("carpintero"), detalleProyecto)
router.get("/detalle/:id", verificarTokenJWT, detalleProyecto)

// Modificar: solo el carpintero dueño del proyecto
router.delete("/eliminar/:id", verificarTokenJWT, permitirRoles("carpintero"), eliminarProyecto)
router.put("/actualizar/:id", verificarTokenJWT, permitirRoles("carpintero"), actualizarProyecto)

export default router
