import { useEffect, useState } from "react"
import { Link } from "react-router"
import { toast, ToastContainer } from "react-toastify"
import { listarProyectosPropios } from "../services/proyectoChatService"
import storeChat from "../context/storeChat"

// Sección "Mensajes" del dashboard (HU-014). Como el chat no tiene backend que lo
// persista, el "último mensaje" y el badge de no leídos vienen del historial guardado
// en este navegador (storeChat), no de un servidor — si nunca has abierto este chat
// en este navegador, no vas a ver mensajes anteriores aunque existan para el otro lado.
const Mensajes = () => {
  const [proyectos, setProyectos] = useState([])
  const [loading, setLoading] = useState(true)
  const mensajes = storeChat((s) => s.mensajes)
  const noLeidos = storeChat((s) => s.noLeidos)

  useEffect(() => {
    const cargar = async () => {
      try {
        setProyectos(await listarProyectosPropios())
      } catch {
        toast.error("No se pudieron cargar tus proyectos")
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  return (
    <div>
      <ToastContainer />
      <h1 className="font-black text-4xl text-gray-500">Mensajes</h1>
      <hr className="my-4 border-t-2 border-gray-300" />
      <p className="mb-8">
        Conversaciones por proyecto. El historial se guarda solo en este navegador.
      </p>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : proyectos.length === 0 ? (
        <div className="p-4 text-sm text-gray-600 rounded-lg bg-gray-50">
          Todavía no tienes proyectos con los que chatear.
        </div>
      ) : (
        <div className="space-y-3 max-w-2xl">
          {proyectos.map((p) => {
            const hist = mensajes[p._id] || []
            const ultimo = hist[hist.length - 1]
            const noLeidosP = noLeidos[p._id] || 0
            return (
              <Link
                key={p._id}
                to={`/dashboard/chat/${p._id}`}
                className="flex items-center justify-between bg-white rounded-lg shadow p-4 hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800">{p.nombreProyecto}</p>
                  <p className="text-sm text-gray-500 truncate max-w-md">
                    {ultimo ? `${ultimo.from === "Yo" ? "Tú: " : ""}${ultimo.body}` : "Sin mensajes todavía en este navegador"}
                  </p>
                </div>
                {noLeidosP > 0 && (
                  <span className="ml-3 shrink-0 inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full bg-red-600 text-white text-xs font-bold">
                    {noLeidosP}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Mensajes
