import { Router } from 'express'
import {
    registro,
    confirmarMail,
    recuperarPassword,
    comprobarTokenPassword,
    crearNuevoPassword,
    login,
    perfil,
    actualizarPerfil,
    actualizarPassword,
    subirCV,
    verMiCV,
    listarAprobados,
    detalleAprobado
} from '../controllers/carpintero_controller.js'

import { verificarTokenJWT } from '../middlewares/JWT.js'
import { permitirRoles } from '../middlewares/roles.js'
import { subidaArchivos } from '../middlewares/subida.js'

const router = Router()

// -------------------------------
//  Registro y confirmación
// -------------------------------
router.post('/registro', registro)
router.get('/confirmar/:token', confirmarMail)

// -------------------------------
//  Recuperación de contraseña
// -------------------------------
router.post('/recuperarpassword', recuperarPassword)
router.get('/recuperarpassword/:token', comprobarTokenPassword)
router.post('/nuevopassword/:token', crearNuevoPassword)

// -------------------------------
//  Autenticación
// -------------------------------
router.post('/login', login)

// -------------------------------
//  Rutas privadas del carpintero (requieren JWT)
// -------------------------------
router.get('/perfil', verificarTokenJWT, permitirRoles('carpintero'), perfil)
router.put('/actualizarperfil/:id', verificarTokenJWT, permitirRoles('carpintero'), actualizarPerfil)
router.put('/actualizarpassword/:id', verificarTokenJWT, permitirRoles('carpintero'), actualizarPassword)

// CV en PDF (HU-004): solo carpinteros
router.get('/cv', verificarTokenJWT, permitirRoles('carpintero'), verMiCV)
router.post('/cv', verificarTokenJWT, permitirRoles('carpintero'), subidaArchivos, subirCV)
router.put('/cv', verificarTokenJWT, permitirRoles('carpintero'), subidaArchivos, subirCV)

// Perfiles profesionales aprobados (HU-009): cualquier usuario autenticado
router.get('/aprobados', verificarTokenJWT, listarAprobados)
router.get('/aprobados/:id', verificarTokenJWT, detalleAprobado)

export default router
