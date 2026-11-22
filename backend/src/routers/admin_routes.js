import { Router } from "express"
import {
    loginAdmin,
    perfilAdmin,
    actualizarPerfilAdmin,
    subirFotoAdmin,
    listarUsuarios,
    detalleUsuario,
    aprobarCarpintero,
    rechazarCarpintero,
} from "../controllers/admin_controller.js"
import { verificarTokenJWT } from "../middlewares/JWT.js"
import { permitirRoles } from "../middlewares/roles.js"
import { subidaArchivos } from "../middlewares/subida.js"

const router = Router()

router.post("/login", loginAdmin)

// Todo lo siguiente es exclusivo del administrador
router.use(verificarTokenJWT, permitirRoles("administrador"))

// Perfil propio (HU-020)
router.get("/perfil", perfilAdmin)
router.put("/actualizarperfil", actualizarPerfilAdmin)
router.put("/foto", subidaArchivos, subirFotoAdmin)

router.get("/usuarios", listarUsuarios)
router.get("/usuarios/:rol/:id", detalleUsuario)
router.put("/carpinteros/:id/aprobar", aprobarCarpintero)
router.put("/carpinteros/:id/rechazar", rechazarCarpintero)

export default router
