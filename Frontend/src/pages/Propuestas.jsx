import { useEffect, useState, useCallback } from "react"
import { useParams } from "react-router"
import { ToastContainer, toast } from "react-toastify"
import storeAuth from "../context/storeAuth"
import { listarPropuestasProyecto, mensajeError } from "../services/propuestaService"
import FormPropuesta from "../components/propuestas/FormPropuesta"
import ListaPropuestas from "../components/propuestas/ListaPropuestas"

// Página de propuestas de diseño 3D de un proyecto (Sprint 3 · HU-011 / HU-012).
// Ruta sugerida: dashboard/propuestas/:id  (id = _id del proyecto)
const Propuestas = () => {
  const { id: proyectoId } = useParams()
  const { rol } = storeAuth()
  const [propuestas, setPropuestas] = useState([])
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    try {
      setPropuestas(await listarPropuestasProyecto(proyectoId))
    } catch (error) {
      toast.error(mensajeError(error, "No se pudieron cargar las propuestas"))
    } finally {
      setLoading(false)
    }
  }, [proyectoId])

  useEffect(() => {
    cargar()
  }, [cargar])

  return (
    <div>
      <ToastContainer />
      <h1 className="font-black text-4xl text-gray-500">Propuestas de diseño 3D</h1>
      <hr className="my-4 border-t-2 border-gray-300" />
      <p className="mb-8">
        {rol === "carpintero"
          ? "Envía y revisa las propuestas de diseño 3D de este proyecto."
          : "Revisa las propuestas de diseño 3D enviadas por el carpintero y apruébalas o recházalas."}
      </p>

      {rol === "carpintero" && (
        <div className="mb-6">
          <FormPropuesta proyectoId={proyectoId} onEnviada={cargar} />
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <ListaPropuestas propuestas={propuestas} onCambio={cargar} />
      )}
    </div>
  )
}

export default Propuestas