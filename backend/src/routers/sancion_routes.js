import { Router } from "express"
import {
    crearSancion,
    listarSanciones,
    detalleSancion,
    misSanciones,
    actualizarSancion,
} from "../controllers/sancion_controller.js"
import { verificarTokenJWT } from "../middlewares/JWT.js"
import { permitirRoles } from "../middlewares/roles.js"
import { subidaArchivos } from "../middlewares/subida.js"

const router = Router()

router.use(verificarTokenJWT)

// Un carpintero solo puede ver sus propias sanciones
router.get("/mias", permitirRoles("carpintero"), misSanciones)

// Gestión de sanciones (HU-017): solo administrador
router.use(permitirRoles("administrador"))

router.post("/", subidaArchivos, crearSancion)
router.get("/", listarSanciones)
router.get("/:id", detalleSancion)
router.put("/:id", actualizarSancion)

export default router
