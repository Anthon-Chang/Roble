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
    actualizarPassword
} from '../controllers/carpintero_controller.js'

import { verificarTokenJWT } from '../middlewares/JWT.js'

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
//  Rutas privadas (requieren JWT)
// -------------------------------
router.get('/perfil', verificarTokenJWT, perfil)
router.put('/actualizarperfil/:id', verificarTokenJWT, actualizarPerfil)
router.put('/actualizarpassword/:id', verificarTokenJWT, actualizarPassword)

export default router
