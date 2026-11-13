import { Router } from "express"
import {
    getAllModels,
    getModelById,
    getMyModels,
    searchModelByName,
    createModel,
    updateModel,
    deleteModel,
} from "../controllers/model3d_controller.js"
import { verificarTokenJWT } from "../middlewares/JWT.js"
import { carpinteroAprobado } from "../middlewares/roles.js"
import { subidaArchivos } from "../middlewares/subida.js"

const router = Router()

router.use(verificarTokenJWT)

// Exploración del catálogo (HU-008): cualquier usuario autenticado
router.get("/", getAllModels)
router.get("/search", searchModelByName)
router.get("/mis-modelos", carpinteroAprobado, getMyModels)
router.get("/:id", getModelById)

// Gestión del catálogo (HU-007): solo carpinteros aprobados, sobre sus propios modelos
router.post("/", carpinteroAprobado, subidaArchivos, createModel)
router.put("/:id", carpinteroAprobado, subidaArchivos, updateModel)
router.delete("/:id", carpinteroAprobado, deleteModel)

export default router
