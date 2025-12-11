import express from "express";
import { loginGoogle } from "../controllers/authGoogleController.js";

const router = express.Router();

router.post("/google", loginGoogle);

export default router;
