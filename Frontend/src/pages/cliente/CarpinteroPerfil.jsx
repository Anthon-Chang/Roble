import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { ToastContainer, toast } from "react-toastify"
import storeAuth from "../../context/storeAuth"
import { detalleCarpintero, mensajeError } from "../../services/clienteService"
import ClienteNav from "../../components/cliente/ClienteNav"

const dato = (label, valor) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="font-semibold text-gray-800">{valor || "-"}</p>
  </div>
)

const CarpinteroPerfil = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const clearToken = storeAuth((s) => s.clearToken)
  const [c, setC] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      try {
        setC(await detalleCarpintero(id))
      } catch (e) {
        if (e.response?.status === 401) return clearToken()
        toast.error(mensajeError(e, "No se pudo cargar el perfil"))
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [id])

  if (loading) return <p className="text-gray-500">Cargando...</p>
  if (!c) {
    return (
      <div>
        <ToastContainer />
        <p className="text-red-800 mb-4">No se encontró el carpintero.</p>
        <button className="underline" onClick={() => navigate("/dashboard/explorar")}>Volver</button>
      </div>
    )
  }

  return (
    <div>
      <ToastContainer />
      <h1 className="font-black text-4xl text-gray-500">{c.nombre} {c.apellido}</h1>
      <hr className="my-4 border-t-2 border-gray-300" />
      <ClienteNav />
      <button className="text-sm underline mb-4" onClick={() => navigate("/dashboard/explorar")}>← Volver a carpinteros</button>

      <section className="bg-white rounded-lg shadow p-6 grid sm:grid-cols-2 gap-4 mb-6">
        {dato("Años de experiencia", c.anios_experiencia)}
        {dato("Celular", c.celular)}
        {dato("Dirección", c.direccion)}
        <div>
          <p className="text-sm text-gray-500">Currículum</p>
          {c.cvUrl ? (
            <a href={c.cvUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline text-amber-700">
              Ver CV (PDF)
            </a>
          ) : <p className="font-semibold text-gray-800">-</p>}
        </div>
      </section>

      <Link to={`/dashboard/solicitar?carpintero=${c._id}`} className="inline-block mb-8 px-5 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800">
        Solicitar un proyecto a este carpintero
      </Link>

      <h2 className="text-2xl font-semibold text-gray-600 mb-3">Mobiliario publicado</h2>
      {c.muebles?.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {c.muebles.map((m) => (
            <div key={m._id} className="bg-white rounded-lg shadow overflow-hidden text-gray-800">
              {m.imagenes?.[0] && <img src={m.imagenes[0].url} alt={m.nombre} className="w-full h-40 object-cover" />}
              <div className="p-4 space-y-1">
                <p className="font-bold">{m.nombre}</p>
                <p className="text-sm">{m.descripcion}</p>
                {m.precio != null && <p className="text-sm font-semibold">$ {m.precio}</p>}
              </div>
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-gray-500 mb-8">Aún no publica mobiliario.</p>}

      <h2 className="text-2xl font-semibold text-gray-600 mb-3">Modelos 3D</h2>
      {c.modelos3D?.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {c.modelos3D.map((m) => (
            <div key={m._id} className="bg-white rounded-lg shadow p-4 text-gray-800 space-y-1">
              <p className="font-bold">{m.name}</p>
              <p className="text-sm">{m.description || "Sin descripción"}</p>
              <Link to={`/dashboard/catalogo/modelo/${m._id}`} className="inline-block mt-2 px-3 py-1 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-700">
                Ver modelo
              </Link>
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-gray-500">Aún no publica modelos 3D.</p>}
    </div>
  )
}

export default CarpinteroPerfil