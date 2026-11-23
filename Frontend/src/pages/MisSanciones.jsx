import { useEffect, useState } from "react"
import { ToastContainer, toast } from "react-toastify"
import storeAuth from "../context/storeAuth"
import { misSanciones, mensajeError } from "../services/sancionService"
import CarpinteroNav from "../components/carpintero/CarpinteroNav"

const NIVELES = {
  retencion_pago: "Retención del pago",
  suspension_temporal: "Suspensión temporal",
  suspension_permanente: "Suspensión permanente",
}

const BADGE_ACTIVA = { true: "bg-red-100 text-red-800", false: "bg-gray-100 text-gray-600" }
const fecha = (f) => (f ? new Date(f).toLocaleString("es-EC") : "-")

const MisSanciones = () => {
  const clearToken = storeAuth((s) => s.clearToken)
  const [sanciones, setSanciones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      try {
        setSanciones(await misSanciones())
      } catch (error) {
        if (error.response?.status === 401) return clearToken()
        toast.error(mensajeError(error, "No se pudo cargar tus sanciones"))
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  return (
    <div>
      <ToastContainer />
      <h1 className="font-black text-4xl text-gray-500">Mis sanciones</h1>
      <hr className="my-4 border-t-2 border-gray-300" />
      <CarpinteroNav />

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : sanciones.length === 0 ? (
        <div className="p-4 text-sm text-green-800 rounded-lg bg-green-50">No tienes sanciones registradas.</div>
      ) : (
        <div className="space-y-4">
          {sanciones.map((s) => (
            <div key={s._id} className="bg-white rounded-lg shadow p-5 text-gray-800">
              <div className="flex items-center justify-between gap-3 mb-2">
                <h2 className="font-bold text-lg">{NIVELES[s.nivel] || s.nivel}</h2>
                <span className={`text-xs px-3 py-1 rounded ${BADGE_ACTIVA[String(s.activa)]}`}>
                  {s.activa ? "Vigente" : "Revocada"}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap mb-2">{s.motivo}</p>
              {s.nivel === "suspension_temporal" && (
                <p className="text-sm text-gray-600">
                  Días de suspensión: {s.diasSuspension} · Finaliza: {fecha(s.finSuspension)}
                </p>
              )}
              {s.evidenciaUrl && (
                <a href={s.evidenciaUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-amber-700 underline">
                  Ver evidencia
                </a>
              )}
              <p className="text-xs text-gray-500 mt-2">Registrada: {fecha(s.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MisSanciones
