import express from "express";
import { loginGoogle } from "../controllers/authGoogleController.js";
import { logout } from "../controllers/sesion_controller.js";
import { verificarSesion } from "../middlewares/JWT.js";

const router = express.Router();

router.post("/google", loginGoogle);

// Cierre de sesión para cualquier rol (también un cliente con contraseña temporal)
router.post("/logout", verificarSesion, logout);

export default router;
