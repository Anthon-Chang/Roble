import { useEffect, useRef, useState } from "react"
import { useParams } from "react-router"
import { useForm } from "react-hook-form"
import { ToastContainer, toast } from "react-toastify"
import storeAuth from "../context/storeAuth"
import storeProfile from "../context/storeProfile"
import storeChat from "../context/storeChat"
import { getSocket } from "../services/socket"
import { historialMensajes, mensajeError } from "../services/mensajeService"

const emojis = ["😀", "😂", "😍", "😎", "😭", "🔥", "👍", "❤️"]

// Chat en tiempo real de un proyecto (Sprint 3 · HU-014), ahora con historial persistente
// (los mensajes se guardan en el backend, ver backend/src/models/Mensaje.js):
//   1) al entrar, se trae el historial por REST (GET /api/mensaje/:proyectoId)
//   2) la conexión en vivo usa el socket compartido (services/socket.js) con el JWT en el
//      handshake y se une a la sala del proyecto con "unirse-proyecto" antes de enviar nada
//   3) el servidor reparte cada mensaje nuevo a TODA la sala (incluido quien lo envía), así
//      que aquí no se "adivina" el mensaje propio: siempre llega por el socket
// Ruta: dashboard/chat/:id  (id = _id del proyecto)
const ChatProyecto = () => {
  const { id: proyectoId } = useParams()
  const token = storeAuth((s) => s.token)
  const miId = storeProfile((s) => s.user?._id)
  const marcarLeido = storeChat((s) => s.marcarLeido)
  const cargarResumen = storeChat((s) => s.cargarResumen)
  const [isConnected, setIsConnected] = useState(false)
  const [enSala, setEnSala] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [mensajes, setMensajes] = useState([])
  const [showEmojis, setShowEmojis] = useState(false)
  const bottomRef = useRef(null)

  const { register, handleSubmit, reset, setValue, watch } = useForm({ defaultValues: { message: "" } })

  // Historial (carga inicial)
  useEffect(() => {
    if (!proyectoId) return
    setCargando(true)
    historialMensajes(proyectoId)
      .then(setMensajes)
      .catch((error) => toast.error(mensajeError(error, "No se pudo cargar el historial del chat")))
      .finally(() => setCargando(false))
  }, [proyectoId])

  // Conexión en vivo
  useEffect(() => {
    if (!token || !proyectoId) return
    const socket = getSocket(token)

    const unirse = () => {
      socket.emit("unirse-proyecto", proyectoId, (ack) => {
        if (ack?.ok) setEnSala(true)
        else toast.error(ack?.msg || "No se pudo unir a la sala del proyecto")
      })
    }

    setIsConnected(socket.connected)
    if (socket.connected) unirse()

    const alConectar = () => { setIsConnected(true); unirse() }
    const alDesconectar = () => { setIsConnected(false); setEnSala(false) }
    const alLlegarMensaje = (payload) => {
      if (payload.proyecto !== proyectoId) return
      setMensajes((prev) => [...prev, payload])
      marcarLeido(proyectoId)
      cargarResumen()
    }

    socket.on("connect", alConectar)
    socket.on("disconnect", alDesconectar)
    socket.on("connect_error", (err) => toast.error(err.message || "Error de conexión al chat"))
    socket.on("enviar-mensaje-front-back", alLlegarMensaje)

    return () => {
      socket.off("connect", alConectar)
      socket.off("disconnect", alDesconectar)
      socket.off("enviar-mensaje-front-back", alLlegarMensaje)
    }
  }, [token, proyectoId])

  // Entrar a este chat lo marca como leído; también al llegar un mensaje mientras está abierto.
  useEffect(() => {
    marcarLeido(proyectoId)
  }, [proyectoId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensajes])

  const handleMessageChat = (data) => {
    const socket = getSocket(token)
    if (!enSala) return toast.error("Todavía no estás conectado a la sala del proyecto")
    if (!data.message?.trim()) return

    socket.emit("enviar-mensaje-front-back", { proyecto: proyectoId, body: data.message }, (ack) => {
      if (!ack?.ok) return toast.error(ack?.msg || "No se pudo enviar el mensaje")
      reset({ message: "" })
    })
  }

  return (
    <>
      <ToastContainer />
      <div className="flex flex-col h-[80vh] w-full max-w-3xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-[#f59e0b] text-white">
          <p className="font-semibold">💬 Chat del proyecto</p>
          <span className="flex items-center gap-2 text-sm">
            <span className={`h-3 w-3 rounded-full ${enSala ? "bg-green-400" : isConnected ? "bg-yellow-300" : "bg-red-500"}`} />
            {enSala ? "Conectado" : isConnected ? "Uniéndose..." : "Desconectado"}
          </span>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-100">
          {cargando ? (
            <p className="text-center text-gray-400 text-sm">Cargando mensajes...</p>
          ) : mensajes.length === 0 ? (
            <p className="text-center text-gray-400 text-sm">Todavía no hay mensajes. ¡Escribe el primero!</p>
          ) : (
            mensajes.map((r, i) => {
              const esMio = r.remitente === miId
              return (
                <div
                  key={r._id || i}
                  className={`max-w-[75%] px-4 py-2 rounded-xl text-sm break-words ${
                    esMio ? "bg-[#f59e0b] text-white ml-auto rounded-br-none" : "bg-gray-300 text-gray-900 mr-auto rounded-bl-none"
                  }`}
                >
                  <p className="text-xs opacity-70 mb-1">{esMio ? "Yo" : r.from}</p>
                  {r.body}
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit(handleMessageChat)} className="relative flex items-center gap-2 p-3 border-t">
          <button type="button" onClick={() => setShowEmojis((s) => !s)} className="text-xl">
            😊
          </button>
          {showEmojis && (
            <div className="absolute bottom-14 left-3 bg-white shadow-lg rounded-lg p-2 flex gap-1 flex-wrap z-10">
              {emojis.map((e) => (
                <button
                  key={e}
                  type="button"
                  className="text-xl"
                  onClick={() => setValue("message", `${watch("message")}${e}`)}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
          <input
            {...register("message")}
            placeholder="Escribe un mensaje..."
            className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
            disabled={!enSala}
          />
          <button
            type="submit"
            disabled={!enSala}
            className="bg-[#f59e0b] text-white px-4 py-2 rounded-full hover:bg-[#461901] transition disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      </div>
    </>
  )
}

export default ChatProyecto
