import {Router} from 'express'
import { registrarProyecto, listarProyectos, detalleProyecto, eliminarProyecto, actualizarProyecto, loginClienteProyecto, perfilClienteProyecto } from '../controllers/proyecto_controller.js'
import { verificarTokenJWT } from '../middlewares/JWT.js'
import { authSimple } from '../middlewares/authSimple.js';


const router = Router()

router.post("/login", loginClienteProyecto)
router.get("/perfil", authSimple, perfilClienteProyecto)

router.post("/registro", authSimple, registrarProyecto)
router.get("/listar",authSimple, listarProyectos)
router.get("/detalle/:id",authSimple, detalleProyecto)
router.delete("/eliminar/:id",authSimple, eliminarProyecto)
router.put("/actualizar/:id",authSimple, actualizarProyecto)



export default router