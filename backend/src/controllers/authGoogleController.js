import { OAuth2Client } from "google-auth-library";
import Carpintero from "../models/carpintero.js";
import jwt from "jsonwebtoken";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const loginGoogle = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ msg: "Falta el token de Google" });
        }

        // Verificar token de Google
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const email = payload.email;
        const nombre = payload.name;
        const picture = payload.picture;

        // Buscar si existe
        let user = await Carpintero.findOne({ email });

        // Si no existe, lo crea
        if (!user) {
            user = await Carpintero.create({
                nombre,
                email,
                password: "google_login",
                confirmado: true,
                imagen: picture,
                rol: "carpintero" // Ajusta si tu modelo usa otro rol por defecto
            });
        }

        // Crear token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            token,
            rol: user.rol,
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Error al iniciar sesión con Google" });
    }
};
