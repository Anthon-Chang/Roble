import { Router } from "express"
import {
    crearMueble,
    listarMisMuebles,
    listarMuebles,
    detalleMueble,
    actualizarMueble,
    eliminarMueble,
} from "../controllers/mueble_controller.js"
import { verificarTokenJWT } from "../middlewares/JWT.js"
import { carpinteroAprobado } from "../middlewares/roles.js"

const router = Router()

router.use(verificarTokenJWT)

// Lectura: cualquier usuario autenticado (el catálogo solo muestra carpinteros aprobados)
router.get("/", listarMuebles)
router.get("/mis-muebles", carpinteroAprobado, listarMisMuebles)
router.get("/:id", detalleMueble)

// Escritura: solo carpinteros aprobados, y únicamente sobre sus propios muebles
router.post("/", carpinteroAprobado, crearMueble)
router.put("/:id", carpinteroAprobado, actualizarMueble)
router.delete("/:id", carpinteroAprobado, eliminarMueble)

export default router
