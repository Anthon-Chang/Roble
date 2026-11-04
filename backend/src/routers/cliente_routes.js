import { Router } from "express"
import { registroCliente, loginCliente, perfilCliente } from "../controllers/cliente_controller.js"
import { verificarTokenJWT } from "../middlewares/JWT.js"
import { permitirRoles } from "../middlewares/roles.js"

const router = Router()

router.post("/registro", registroCliente)
router.post("/login", loginCliente)
router.get("/perfil", verificarTokenJWT, permitirRoles("cliente"), perfilCliente)

export default router
