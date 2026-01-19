// authSimple.js
import jwt from "jsonwebtoken";
import Carpintero from "../models/carpintero.js";
import Proyecto from "../models/Proyecto.js";

export const authSimple = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ msg: "No autorizado" });

    try {
        const { id, rol } = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = id;
        req.userRole = rol;

        if (rol === "carpintero") {
            const user = await Carpintero.findById(id).select("-password");
            if (!user) return res.status(401).json({ msg: "Usuario no encontrado" });
            req.userData = user;
        } else {
            const user = await Proyecto.findById(id).select("-passwordCliente");
            if (!user) return res.status(401).json({ msg: "Usuario no encontrado" });
            req.userData = user;
        }

        next();
    } catch (err) {
        return res.status(403).json({ msg: "Token inválido o expirado" });
    }
};
