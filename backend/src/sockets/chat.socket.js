import { autenticarToken } from "../middlewares/JWT.js"
import Proyecto from "../models/Proyecto.js"
import Mensaje from "../models/Mensaje.js"
import { idValido } from "../helpers/firestore.js"
import { esParticipante } from "../helpers/participantes.js"

const MAX_MENSAJE = 1000
// Máximo de mensajes por conexión en la ventana (frena el spam y el flood de una sola conexión)
const MAX_MENSAJES = 20
const VENTANA_MS = 10 * 1000

const sala = (proyectoId) => `proyecto:${proyectoId}`

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

        // 3) Enviar un mensaje: se guarda en Firestore y se reparte a TODA la sala (incluido
        // quien lo envía), así el remitente queda con el mismo _id/fecha que el resto y no hay
        // que fabricar un mensaje "optimista" aparte en el frontend.
        socket.on("enviar-mensaje-front-back", async (payload, ack) => {
            try {
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

                const guardado = await Mensaje.crear({
                    proyecto,
                    body: body.trim(),
                    remitente: user._id,
                    rol: user.rol,
                    from: `${user.nombre || ""} ${user.apellido || ""}`.trim() || user.rol,
                })

                io.to(sala(proyecto)).emit("enviar-mensaje-front-back", {
                    _id: guardado._id,
                    proyecto,
                    body: guardado.body,
                    from: guardado.from,
                    remitente: guardado.remitente,
                    rol: guardado.rol,
                    fecha: guardado.createdAt,
                })
                responder(ack, { ok: true })
            } catch (error) {
                console.error(error)
                responder(ack, { ok: false, msg: "Error en el servidor" })
            }
        })
    })
}
