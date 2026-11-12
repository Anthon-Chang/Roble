import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { ToastContainer, toast } from "react-toastify"
import storeAuth from "../../context/storeAuth"
import { descargarArchivo, detalleModelo, mensajeError } from "../../services/clienteService"
import ClienteNav from "../../components/cliente/ClienteNav"
import ThreeViewer from "../../components/model3D/model3DViewer.jsx"

const ModeloDetalle = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const clearToken = storeAuth((s) => s.clearToken)
  const [m, setM] = useState(null)
  const [loading, setLoading] = useState(true)
  const [visor, setVisor] = useState(false)

  useEffect(() => {
    const cargar = async () => {
      try {
        setM(await detalleModelo(id))
      } catch (e) {
        if (e.response?.status === 401) return clearToken()
        toast.error(mensajeError(e, "No se pudo cargar el modelo"))
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [id])

  if (loading) return <p className="text-gray-500">Cargando...</p>
  if (!m) {
    return (
      <div>
        <ToastContainer />
        <p className="text-red-800 mb-4">No se encontró el modelo.</p>
        <button className="underline" onClick={() => navigate("/dashboard/catalogo")}>Volver al catálogo</button>
      </div>
    )
  }

  const previsualizable = ["glb", "gltf"].includes(m.formato)

  return (
    <div>
      <ToastContainer />
      <h1 className="font-black text-4xl text-gray-500">{m.name}</h1>
      <hr className="my-4 border-t-2 border-gray-300" />
      <ClienteNav />
      <button className="text-sm underline mb-4" onClick={() => navigate("/dashboard/catalogo")}>← Volver al catálogo</button>

      <section className="bg-white rounded-lg shadow p-6 text-gray-800 space-y-3 mb-6 max-w-3xl">
        <p>{m.description || "Este modelo no tiene descripción."}</p>
        <ul className="text-sm space-y-1">
          <li><b>Formato:</b> <span className="uppercase">{m.formato || "-"}</span></li>
          <li><b>Publicado:</b> {m.createdAt ? new Date(m.createdAt).toLocaleDateString("es-EC") : "-"}</li>
        </ul>

        <div className="flex flex-wrap gap-3 pt-2">
          {previsualizable ? (
            <button onClick={() => setVisor((v) => !v)} className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700">
              {visor ? "Ocultar visor 3D" : "Visualizar e interactuar"}
            </button>
          ) : (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-300 rounded-md p-2">
              La vista interactiva solo está disponible para .glb y .gltf. Puedes descargar el archivo.
            </p>
          )}
          {m.modelUrl && (
            <button onClick={() => descargarArchivo(m.modelUrl, `${m.name}.${m.formato || "glb"}`)} className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800">
              Descargar modelo
            </button>
          )}
          {m.carpintero && (
            <Link to={`/dashboard/explorar/${m.carpintero}`} className="px-4 py-2 border border-gray-300 rounded-lg">Ver carpintero</Link>
          )}
        </div>
      </section>

      {visor && previsualizable && (
        <section className="max-w-3xl">
          <ThreeViewer modelUrl={m.modelUrl} />
          <p className="text-xs text-gray-500 mt-2">Arrastra para rotar, usa la rueda para acercar y clic derecho para mover.</p>
        </section>
      )}
    </div>
  )
}

export default ModeloDetalle