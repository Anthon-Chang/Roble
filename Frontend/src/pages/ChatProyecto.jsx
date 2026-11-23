import { useEffect, useRef, useState } from "react"
import { useParams } from "react-router"
import { useForm } from "react-hook-form"
import { ToastContainer, toast } from "react-toastify"
import storeAuth from "../context/storeAuth"
import storeChat from "../context/storeChat"
import { getSocket } from "../services/socket"

const emojis = ["😀", "😂", "😍", "😎", "😭", "🔥", "👍", "❤️"]

// Chat en tiempo real de un proyecto (Sprint 3 · HU-014), 100% frontend: usa el socket
// único que abre Dashboard.jsx (src/services/socket.js) y el historial guardado en
// localStorage (src/context/storeChat.jsx). No hay ninguna llamada REST nueva aquí.
// A diferencia de src/pages/Chat.jsx (chat genérico sin sala ni autenticación), este:
//   1) usa el JWT ya puesto en el handshake del socket.
//   2) se une a la sala del proyecto con "unirse-proyecto" (idempotente si Dashboard
//      ya lo había unido antes).
// Ruta sugerida: dashboard/chat/:id  (id = _id del proyecto)
const ChatProyecto = () => {
  const { id: proyectoId } = useParams()
  const { token, rol } = storeAuth()
  const historial = storeChat((s) => s.mensajes[proyectoId] || [])
  const agregarMensaje = storeChat((s) => s.agregarMensaje)
  const marcarLeido = storeChat((s) => s.marcarLeido)
  const [isConnected, setIsConnected] = useState(false)
  const [enSala, setEnSala] = useState(false)
  const [showEmojis, setShowEmojis] = useState(false)
  const bottomRef = useRef(null)

  const { register, handleSubmit, reset, setValue, watch } = useForm({ defaultValues: { message: "" } })

  // Al abrir este chat, se marca como leído (limpia el badge de "Mensajes" para este proyecto)
  useEffect(() => {
    if (proyectoId) marcarLeido(proyectoId)
  }, [proyectoId, marcarLeido])

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

    socket.on("connect", () => {
      setIsConnected(true)
      unirse()
    })
    socket.on("disconnect", () => {
      setIsConnected(false)
      setEnSala(false)
    })

    return () => {
      socket.off("connect", unirse)
    }
  }, [token, proyectoId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [historial])

  const handleMessageChat = (data) => {
    if (!token) return
    const socket = getSocket(token)
    if (!socket.connected || !enSala) return toast.error("Todavía no estás conectado a la sala del proyecto")
    if (!data.message?.trim()) return

    socket.emit("enviar-mensaje-front-back", { proyecto: proyectoId, body: data.message }, (ack) => {
      if (!ack?.ok) return toast.error(ack?.msg || "No se pudo enviar el mensaje")
      agregarMensaje(proyectoId, { body: data.message, rol, from: "Yo", fecha: new Date().toISOString() })
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
          {historial.length === 0 && (
            <p className="text-sm text-gray-500 text-center mt-4">
              Sin mensajes todavía en este navegador.
            </p>
          )}
          {historial.map((r, i) => (
            <div
              key={i}
              className={`max-w-[75%] px-4 py-2 rounded-xl text-sm break-words ${
                r.from === "Yo" ? "bg-[#f59e0b] text-white ml-auto rounded-br-none" : "bg-gray-300 text-gray-900 mr-auto rounded-bl-none"
              }`}
            >
              <p className="text-xs opacity-70 mb-1">{r.from}</p>
              {r.body}
            </div>
          ))}
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
