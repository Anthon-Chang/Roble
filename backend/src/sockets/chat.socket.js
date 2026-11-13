import { autenticarToken } from "../middlewares/JWT.js"
import Proyecto from "../models/Proyecto.js"
import { idValido } from "../helpers/firestore.js"

const MAX_MENSAJE = 1000
// Máximo de mensajes por conexión en la ventana (frena el spam y el flood de una sola conexión)
const MAX_MENSAJES = 20
const VENTANA_MS = 10 * 1000

const sala = (proyectoId) => `proyecto:${proyectoId}`

// Solo participan del chat el carpintero dueño del proyecto y el cliente del proyecto.
const esParticipante = (proyecto, user) =>
    !!proyecto &&
    proyecto.estadoProyecto !== false &&
    ((user.rol === "carpintero" && proyecto.carpintero === user._id) ||
        (user.rol === "cliente" && proyecto.cliente === user._id))

const responder = (ack, datos) => typeof ack === "function" && ack(datos)

export const chatSocket = (io) => {
    // 1) Autenticación en el handshake: sin un JWT válido la conexión se rechaza
    io.use(async (socket, next) => {
        try {
            const crudo = socket.handshake.auth?.token || socket.handshake.headers?.authorization || ""
            const token = String(crudo).replace(/^Bearer\s+/i, "")
            if (!token) return next(new Error("No autorizado: token no proporcionado"))

            const { usuario, msg } = await autenticarToken(token)
            if (!usuario) return next(new Error(`No autorizado: ${msg}`))
            if (usuario.rol === "cliente" && usuario.passwordTemporal === true) {
                return next(new Error("No autorizado: debes cambiar tu contraseña temporal"))
            }
            socket.data.user = usuario
            next()
        } catch (error) {
            console.error(error)
            next(new Error("No autorizado"))
        }
    })

    io.on("connection", (socket) => {
        const user = socket.data.user
        let enviados = []

        // 2) Unirse a la sala de un proyecto: solo sus participantes
        socket.on("unirse-proyecto", async (proyectoId, ack) => {
            try {
                if (!idValido(proyectoId)) return responder(ack, { ok: false, msg: "Proyecto no válido" })
                const proyecto = await Proyecto.porId(proyectoId)
                if (!esParticipante(proyecto, user)) return responder(ack, { ok: false, msg: "Acción no permitida" })

                await socket.join(sala(proyecto._id))
                responder(ack, { ok: true })
            } catch (error) {
                console.error(error)
                responder(ack, { ok: false, msg: "Error en el servidor" })
            }
        })

        // 3) Enviar un mensaje: solo a la sala del proyecto, con el remitente tomado del token (no del payload)
        socket.on("enviar-mensaje-front-back", (payload, ack) => {
            const { proyecto, body } = payload && typeof payload === "object" ? payload : {}

            if (!idValido(proyecto) || !socket.rooms.has(sala(proyecto))) {
                return responder(ack, { ok: false, msg: "Primero debes unirte al proyecto" })
            }
            if (typeof body !== "string" || body.trim() === "" || body.length > MAX_MENSAJE) {
                return responder(ack, { ok: false, msg: `El mensaje debe tener entre 1 y ${MAX_MENSAJE} caracteres` })
            }

            const ahora = Date.now()
            enviados = enviados.filter((t) => ahora - t < VENTANA_MS)
            if (enviados.length >= MAX_MENSAJES) {
                return responder(ack, { ok: false, msg: "Estás enviando mensajes demasiado rápido" })
            }
            enviados.push(ahora)

            socket.to(sala(proyecto)).emit("enviar-mensaje-front-back", {
                proyecto,
                body: body.trim(),
                from: `${user.nombre || ""} ${user.apellido || ""}`.trim() || user.rol,
                rol: user.rol,
                fecha: new Date().toISOString(),
            })
            responder(ack, { ok: true })
        })
    })
}
