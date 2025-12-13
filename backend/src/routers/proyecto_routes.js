import {Router} from 'express'
import { registrarProyecto } from '../controllers/proyecto_controller.js'
import { verificarTokenJWT } from '../middlewares/JWT.js'
const router = Router()


router.post("/registro", verificarTokenJWT, registrarProyecto)


export default router