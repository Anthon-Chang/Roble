import { Router } from "express"
import {
    crearQueja,
    listarQuejas,
    detalleQueja,
    seguimientoQueja,
    eliminarQueja,
} from "../controllers/queja_controller.js"
import { verificarTokenJWT } from "../middlewares/JWT.js"
import { permitirRoles } from "../middlewares/roles.js"
import { subidaArchivos } from "../middlewares/subida.js"

const router = Router()

// Crear una queja o sugerencia (HU-016): cualquier cliente autenticado
router.post("/", verificarTokenJWT, permitirRoles("cliente"), subidaArchivos, crearQueja)

// Gestión de quejas y sugerencias (HU-016): solo administrador
router.use(verificarTokenJWT, permitirRoles("administrador"))

router.get("/", listarQuejas)
router.get("/:id", detalleQueja)
router.put("/:id/seguimiento", seguimientoQueja)
router.delete("/:id", eliminarQueja)

export default router
