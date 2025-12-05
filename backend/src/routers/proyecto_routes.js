import {Router} from 'express'
import { registrarProyecto } from '../controllers/proyecto_controller.js'
const router = Router()


router.post("/registro", registrarProyecto)


export default router