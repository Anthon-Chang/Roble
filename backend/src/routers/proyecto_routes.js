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
import { verificarTokenJWT, verificarSesion } from '../middlewares/JWT.js'
import { permitirRoles, carpinteroAprobado, aprobadoSiEsCarpintero } from '../middlewares/roles.js'
import { subidaArchivos } from '../middlewares/subida.js'

const router = Router()

// Acceso del cliente (compatibilidad con el frontend actual; la cuenta vive en /api/cliente)
router.post("/login", loginClienteProyecto)
// verificarSesion: un cliente con contraseña temporal puede ver su perfil para que el frontend le pida cambiarla
router.get("/perfil", verificarSesion, permitirRoles("cliente"), perfilClienteProyecto)

// Crear proyecto (los archivos se reciben solo después de autenticar y autorizar)
router.post("/solicitar", verificarTokenJWT, permitirRoles("cliente"), subidaArchivos, solicitarProyecto) // HU-010
router.post("/registro", verificarTokenJWT, carpinteroAprobado, subidaArchivos, registrarProyecto)

// Consultar: un carpintero debe estar aprobado
router.get("/listar", verificarTokenJWT, permitirRoles("carpintero", "cliente", "administrador"), aprobadoSiEsCarpintero, listarProyectos)
router.get("/requerimientos", verificarTokenJWT, carpinteroAprobado, listarRequerimientos) // HU-011
router.get("/requerimientos/:id", verificarTokenJWT, carpinteroAprobado, detalleProyecto)
router.get("/detalle/:id", verificarTokenJWT, aprobadoSiEsCarpintero, detalleProyecto)

// Modificar: solo el carpintero aprobado dueño del proyecto (la propiedad se valida en el controlador)
router.delete("/eliminar/:id", verificarTokenJWT, carpinteroAprobado, eliminarProyecto)
router.put("/actualizar/:id", verificarTokenJWT, carpinteroAprobado, subidaArchivos, actualizarProyecto)

export default router
