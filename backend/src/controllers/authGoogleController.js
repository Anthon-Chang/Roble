import { OAuth2Client } from "google-auth-library";
import Carpintero from "../models/carpintero.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { crearTokenJWT } from "../middlewares/JWT.js"

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const loginGoogle = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ msg: "Falta el token de Google" });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });


    const payload = ticket.getPayload(); 
    const { email, given_name, family_name } = payload;

    let user = await Carpintero.findOne({ email });

    // 🧠 SI EXISTE (registro normal)
    if (user) {
      if (!user.confirmEmail) {
        user.confirmEmail = true;
      }

      if (user.provider !== "google") {
        user.provider = "google";
        await user.save();
      }
    }

    // 🧠 SI NO EXISTE
    if (!user) {
      const passwordRandom = await bcrypt.hash(
        Math.random().toString(36),
        10
      );

      user = await Carpintero.create({
    nombre: given_name || "Usuario",
    apellido: family_name || "",
    email,
    password: passwordRandom,
    confirmEmail: true,
    rol: "carpintero",
    provider: "google"
    });
    }

    const token = crearTokenJWT(user._id, user.rol)

    res.json({
      token,
      rol: user.rol,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al iniciar sesión con Google" });
  }
};

