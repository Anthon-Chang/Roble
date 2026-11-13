import Administrador from "../models/Administrador.js"
import Carpintero from "../models/carpintero.js"
import Cliente from "../models/Cliente.js"
import { crearTokenJWT } from "../middlewares/JWT.js"
import { matchPassword } from "../helpers/password.js"
import { masRecientesPrimero, sinSecretos } from "../helpers/firestore.js"
import { sendMailEstadoPerfil } from "../helpers/sendMail.js"

const OCULTOS_ADMIN = ["cvPath"]
const ROLES_GESTIONABLES = { carpintero: Carpintero, cliente: Cliente }

// =============================
// LOGIN DEL ADMINISTRADOR
// =============================
export const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({ msg: "Debes llenar todos los campos" })
        }

        const admin = await Administrador.porEmail(email)
        if (!admin || admin.status === false || !(await matchPassword(password, admin.password))) {
            return res.status(401).json({ msg: "Credenciales incorrectas" })
        }

        res.status(200).json({
            token: crearTokenJWT(admin._id, "administrador", admin.tokenVersion),
            rol: "administrador",
            nombre: admin.nombre,
            _id: admin._id,
            email: admin.email,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}

// =============================
// LISTAR USUARIOS REGISTRADOS (HU-001)
// GET /api/admin/usuarios?rol=carpintero|cliente&estadoAprobacion=pendiente|aprobado|rechazado
// =============================
export const listarUsuarios = async (req, res) => {
    try {
        const { rol, estadoAprobacion } = req.query

        if (rol && !ROLES_GESTIONABLES[rol]) {
            return res.status(400).json({ msg: "El rol debe ser 'carpintero' o 'cliente'" })
        }
        if (estadoAprobacion && !["pendiente", "aprobado", "rechazado"].includes(estadoAprobacion)) {
            return res.status(400).json({ msg: "estadoAprobacion no válido" })
        }

        let carpinteros = []
        let clientes = []
        if (!rol || rol === "carpintero") {
            carpinteros = await Carpintero.listar(estadoAprobacion ? { estadoAprobacion } : {})
        }
        // El estado de aprobación solo aplica a carpinteros
        if ((!rol || rol === "cliente") && !estadoAprobacion) {
            clientes = await Cliente.listar()
        }

        const usuarios = masRecientesPrimero([...carpinteros, ...clientes]).map((u) => sinSecretos(u, OCULTOS_ADMIN))
        res.status(200).json(usuarios)
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}

// =============================
// DETALLE DE UN USUARIO (HU-001)
// =============================
export const detalleUsuario = async (req, res) => {
    try {
        const Modelo = ROLES_GESTIONABLES[req.params.rol]
        if (!Modelo) return res.status(400).json({ msg: "El rol debe ser 'carpintero' o 'cliente'" })

        const usuario = await Modelo.porId(req.params.id)
        if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" })

        res.status(200).json(sinSecretos(usuario, OCULTOS_ADMIN))
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}

const cambiarAprobacion = async (req, res, estado) => {
    try {
        const carpintero = await Carpintero.porId(req.params.id)
        if (!carpintero) return res.status(404).json({ msg: "Carpintero no encontrado" })

        const motivo = typeof req.body?.motivo === "string" ? req.body.motivo.trim() : ""
        if (estado === "rechazado" && !motivo) {
            return res.status(400).json({ msg: "Debes indicar el motivo del rechazo" })
        }
        if (estado === "aprobado" && !carpintero.cvUrl) {
            return res.status(400).json({ msg: "El carpintero aún no ha cargado su CV" })
        }

        const actualizado = await Carpintero.actualizar(carpintero._id, {
            estadoAprobacion: estado,
            motivoRechazo: estado === "rechazado" ? motivo : null,
        })

        sendMailEstadoPerfil(carpintero.email, estado, motivo).catch((e) =>
            console.error("⚠️ No se pudo notificar al carpintero:", e.message)
        )

        res.status(200).json({
            msg: estado === "aprobado" ? "Perfil aprobado correctamente" : "Perfil rechazado correctamente",
            carpintero: sinSecretos(actualizado, OCULTOS_ADMIN),
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ msg: "❌ Error en el servidor" })
    }
}

// =============================
// APROBAR / RECHAZAR PERFIL DEL CARPINTERO (HU-002)
// =============================
export const aprobarCarpintero = (req, res) => cambiarAprobacion(req, res, "aprobado")
export const rechazarCarpintero = (req, res) => cambiarAprobacion(req, res, "rechazado")
