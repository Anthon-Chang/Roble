import { useEffect, useState } from "react"
import { Link } from "react-router"
import { ToastContainer, toast } from "react-toastify"
import storeAuth from "../context/storeAuth"
import { obtenerPerfil, mensajeError } from "../services/carpinteroService"
import CarpinteroNav, { BADGE } from "../components/carpintero/CarpinteroNav"

const MENSAJES = {
  pendiente: "Tu perfil está en revisión. El administrador lo aprobará o rechazará y te avisará por correo.",
  aprobado: "Tu perfil fue aprobado. Ya puedes publicar modelos 3D, mobiliario y recibir proyectos.",
  rechazado: "Tu perfil fue rechazado. Corrige lo indicado y sube un CV nuevo: volverá a revisión.",
}

const PerfilEstado = () => {
  const clearToken = storeAuth((s) => s.clearToken)
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      try {
        setPerfil(await obtenerPerfil())
      } catch (error) {
        if (error.response?.status === 401) return clearToken()
        toast.error(mensajeError(error, "No se pudo cargar tu perfil"))
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  return (
    <div>
      <ToastContainer />
      <h1 className="font-black text-4xl text-gray-500">Estado del perfil</h1>
      <hr className="my-4 border-t-2 border-gray-300" />
      <CarpinteroNav />

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : !perfil ? (
        <div className="p-4 text-sm text-red-800 rounded-lg bg-red-50">No se pudo obtener el estado.</div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl space-y-4 text-gray-800">
          <div className="flex items-center gap-3">
            <span className="font-semibold">Estado de aprobación:</span>
            <span className={`px-3 py-1 rounded capitalize text-sm ${BADGE[perfil.estadoAprobacion]}`}>
              {perfil.estadoAprobacion}
            </span>
          </div>

          <p className="text-sm">{MENSAJES[perfil.estadoAprobacion]}</p>

          {perfil.estadoAprobacion === "rechazado" && perfil.motivoRechazo && (
            <div className="p-4 rounded-lg bg-red-50 text-red-800 text-sm">
              <b>Motivo del rechazo:</b> {perfil.motivoRechazo}
            </div>
          )}

          <div className="text-sm">
            <b>CV cargado:</b> {perfil.cvUrl ? "Sí" : "No"}
            {perfil.cvActualizado && <> · Última actualización: {new Date(perfil.cvActualizado).toLocaleString("es-EC")}</>}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            {perfil.estadoAprobacion !== "aprobado" && (
              <Link to="/dashboard/cv" className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800">
                {perfil.cvUrl ? "Actualizar mi CV" : "Subir mi CV"}
              </Link>
            )}
            {perfil.estadoAprobacion === "aprobado" && (
              <Link to="/dashboard/modelos3d" className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800">
                Administrar modelos 3D
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PerfilEstado