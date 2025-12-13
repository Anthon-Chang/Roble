import {Router} from 'express'
import { registrarProyecto, listarProyectos, detalleProyecto, eliminarProyecto, actualizarProyecto } from '../controllers/proyecto_controller.js'
import { verificarTokenJWT } from '../middlewares/JWT.js'
const router = Router()


router.post("/registro", verificarTokenJWT, registrarProyecto)
router.get("/listar",verificarTokenJWT, listarProyectos)
router.get("/detalle/:id",verificarTokenJWT, detalleProyecto)
router.delete("/eliminar/:id",verificarTokenJWT, eliminarProyecto)
router.put("/actualizar/:id",verificarTokenJWT, actualizarProyecto)

/*
router.get("/test", (req, res) => {
    res.json({ msg: "Ruta proyecto funcionando" })
})
*/


export default router