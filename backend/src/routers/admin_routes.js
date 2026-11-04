import { Router } from "express"
import {
    loginAdmin,
    listarUsuarios,
    detalleUsuario,
    aprobarCarpintero,
    rechazarCarpintero,
} from "../controllers/admin_controller.js"
import { verificarTokenJWT } from "../middlewares/JWT.js"
import { permitirRoles } from "../middlewares/roles.js"

const router = Router()

router.post("/login", loginAdmin)

// Todo lo siguiente es exclusivo del administrador
router.use(verificarTokenJWT, permitirRoles("administrador"))

router.get("/usuarios", listarUsuarios)
router.get("/usuarios/:rol/:id", detalleUsuario)
router.put("/carpinteros/:id/aprobar", aprobarCarpintero)
router.put("/carpinteros/:id/rechazar", rechazarCarpintero)

export default router
