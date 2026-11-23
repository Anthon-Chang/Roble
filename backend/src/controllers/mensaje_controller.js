import Mensaje from "../models/Mensaje.js"
import Proyecto from "../models/Proyecto.js"
import Carpintero from "../models/carpintero.js"
import { idValido } from "../helpers/firestore.js"
import { puedeVerHistorial } from "../helpers/participantes.js"

const responderError = (res, error) => {
    console.error(error)
    res.status(500).json({ msg: "❌ Error en el servidor" })
}

const consultaPorRol = (user) => {
    if (user.rol === "carpintero") return { carpintero: user._id, estadoProyecto: true }
    if (user.rol === "cliente") return { cliente: user._id, estadoProyecto: true }
    return null // administrador: no tiene proyectos propios, no aplica al resumen de chats
}

// =====================================================
// HISTORIAL DE MENSAJES DE UN PROYECTO (carga inicial del chat; el resto llega por Socket.IO)
// =====================================================
export const historialMensajes = async (req, res) => {
    try {
        const { proyectoId } = req.params
        if (!idValido(proyectoId)) return res.status(400).json({ msg: "Proyecto no válido" })

        const proyecto = await Proyecto.porId(proyectoId)
        if (!proyecto) return res.status(404).json({ msg: "Proyecto no encontrado" })
        if (!puedeVerHistorial(proyecto, req.user)) return res.status(403).json({ msg: "Acción no permitida" })

        const mensajes = await Mensaje.porProyecto(proyectoId)
        res.status(200).json(mensajes)
    } catch (error) {
        responderError(res, error)
    }
}

// =====================================================
// RESUMEN DE CHATS (para el badge de "Mensajes" del Dashboard): último mensaje por proyecto
// =====================================================
export const resumenChats = async (req, res) => {
    try {
        const filtro = consultaPorRol(req.user)
        if (!filtro) return res.status(200).json([])

        const proyectos = await Proyecto.listar(filtro)
        if (proyectos.length === 0) return res.status(200).json([])

        const otraParteDe = async (proyecto) => {
            if (req.user.rol === "carpintero") {
                return { nombre: proyecto.nombreCliente || "Cliente" }
            }
            const carpintero = await Carpintero.porId(proyecto.carpintero)
            return { nombre: carpintero ? `${carpintero.nombre} ${carpintero.apellido}`.trim() : "Carpintero" }
        }

        const resumen = await Promise.all(
            proyectos.map(async (proyecto) => {
                const mensajes = await Mensaje.porProyecto(proyecto._id)
                const ultimo = mensajes[mensajes.length - 1] || null
                return {
                    proyecto: proyecto._id,
                    nombreProyecto: proyecto.nombreProyecto,
                    otraParte: await otraParteDe(proyecto),
                    ultimoMensaje: ultimo
                        ? { body: ultimo.body, remitente: ultimo.remitente, rol: ultimo.rol, fecha: ultimo.createdAt }
                        : null,
                }
            })
        )

        res.status(200).json(resumen)
    } catch (error) {
        responderError(res, error)
    }
}
