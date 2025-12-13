import {Router} from 'express'
import { registrarProyecto, listarProyectos } from '../controllers/proyecto_controller.js'
import { verificarTokenJWT } from '../middlewares/JWT.js'
const router = Router()


router.post("/registro", verificarTokenJWT, registrarProyecto)
router.get("/listar",verificarTokenJWT, listarProyectos)


/*
router.get("/test", (req, res) => {
    res.json({ msg: "Ruta proyecto funcionando" })
})
*/


export default router