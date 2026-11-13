import { invalidarSesiones } from "../middlewares/JWT.js"

// =============================
// CERRAR SESIÓN (HU-019)
// Sube la `tokenVersion` del usuario: el token actual y cualquier otro emitido antes dejan de valer.
// =============================
export const logout = async (req, res) => {
    try {
        await invalidarSesiones(req.user.rol, req.user._id)
        res.status(200).json({ msg: "Sesión cerrada correctamente" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}
