import { Router } from "express"
import {
    registroCliente,
    loginCliente,
    perfilCliente,
    actualizarPasswordCliente,
    recuperarPasswordCliente,
    comprobarTokenPasswordCliente,
    crearNuevoPasswordCliente,
} from "../controllers/cliente_controller.js"
import { verificarSesion } from "../middlewares/JWT.js"
import { permitirRoles } from "../middlewares/roles.js"

const router = Router()

router.post("/registro", registroCliente)
router.post("/login", loginCliente)

// Recuperación de contraseña (HU-020)
router.post("/recuperarpassword", recuperarPasswordCliente)
router.get("/recuperarpassword/:token", comprobarTokenPasswordCliente)
router.post("/nuevopassword/:token", crearNuevoPasswordCliente)

// Con una contraseña temporal solo se permiten estas dos rutas (verificarSesion); el resto de la API exige cambiarla
router.get("/perfil", verificarSesion, permitirRoles("cliente"), perfilCliente)
router.put("/actualizarpassword", verificarSesion, permitirRoles("cliente"), actualizarPasswordCliente)

export default router
