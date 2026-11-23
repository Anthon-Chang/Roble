import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ToastContainer, toast } from "react-toastify"
import storeAuth from "../context/storeAuth"
import storeProfile from "../context/storeProfile"
import storeChat from "../context/storeChat"
import { mensajeError } from "../services/mensajeService"

const fecha = (f) => {
  if (!f) return ""
  const d = new Date(f)
  const hoy = new Date()
  const mismoDia = d.toDateString() === hoy.toDateString()
  return mismoDia
    ? d.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("es-EC", { day: "2-digit", month: "short" })
}

const Mensajes = () => {
  const navigate = useNavigate()
  const clearToken = storeAuth((s) => s.clearToken)
  const miId = storeProfile((s) => s.user?._id)
  const resumen = storeChat((s) => s.resumen)
  const cargarResumen = storeChat((s) => s.cargarResumen)
  const marcarLeido = storeChat((s) => s.marcarLeido)
  const noLeido = storeChat((s) => s.noLeido)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarResumen()
      .catch((error) => {
        if (error?.response?.status === 401) return clearToken()
        toast.error(mensajeError(error, "No se pudo cargar tus conversaciones"))
      })
      .finally(() => setLoading(false))
  }, [])

  const abrir = (proyectoId) => {
    marcarLeido(proyectoId)
    navigate(`/dashboard/chat/${proyectoId}`)
  }

  const ordenados = [...resumen].sort((a, b) => {
    const fa = a.ultimoMensaje ? new Date(a.ultimoMensaje.fecha) : 0
    const fb = b.ultimoMensaje ? new Date(b.ultimoMensaje.fecha) : 0
    return fb - fa
  })

  return (
    <div>
      <ToastContainer />
      <h1 className="font-black text-4xl text-gray-500">Mensajes</h1>
      <hr className="my-4 border-t-2 border-gray-300" />

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : ordenados.length === 0 ? (
        <div className="p-4 text-sm text-gray-600 rounded-lg bg-gray-100">
          Todavía no tienes proyectos con chat disponible.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow divide-y divide-gray-100 max-w-2xl">
          {ordenados.map((item) => {
            const sinLeer = noLeido(item, miId)
            return (
              <button
                key={item.proyecto}
                onClick={() => abrir(item.proyecto)}
                className="w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-gray-50"
              >
                <div className="w-11 h-11 rounded-full bg-amber-700 text-white flex items-center justify-center font-bold shrink-0">
                  {(item.otraParte?.nombre || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`truncate ${sinLeer ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                      {item.otraParte?.nombre || "Usuario"}
                    </p>
                    <span className="text-xs text-gray-400 shrink-0">{fecha(item.ultimoMensaje?.fecha)}</span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{item.nombreProyecto}</p>
                  <p className={`text-sm truncate ${sinLeer ? "font-semibold text-gray-800" : "text-gray-500"}`}>
                    {item.ultimoMensaje ? item.ultimoMensaje.body : "Sin mensajes todavía"}
                  </p>
                </div>
                {sinLeer && <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Mensajes
