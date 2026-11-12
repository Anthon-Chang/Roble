import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router"
import { ToastContainer, toast } from "react-toastify"
import storeAuth from "../../context/storeAuth"
import { listarCarpinteros, mensajeError } from "../../services/clienteService"
import ClienteNav from "../../components/cliente/ClienteNav"

const Carpinteros = () => {
  const clearToken = storeAuth((s) => s.clearToken)
  const [lista, setLista] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")

  useEffect(() => {
    const cargar = async () => {
      try {
        setLista(await listarCarpinteros())
      } catch (e) {
        if (e.response?.status === 401) return clearToken()
        toast.error(mensajeError(e, "No se pudo cargar la lista"))
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase()
    return lista.filter((c) => `${c.nombre} ${c.apellido}`.toLowerCase().includes(t))
  }, [lista, q])

  return (
    <div>
      <ToastContainer />
      <h1 className="font-black text-4xl text-gray-500">Carpinteros</h1>
      <hr className="my-4 border-t-2 border-gray-300" />
      <ClienteNav />

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por nombre..."
        className="mb-6 w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-gray-700 bg-white"
      />

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : filtrados.length === 0 ? (
        <div className="p-4 text-sm text-red-800 rounded-lg bg-red-50">No hay carpinteros aprobados para mostrar</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map((c) => (
            <div key={c._id} className="bg-white rounded-lg shadow p-5 text-gray-800 flex flex-col gap-2">
              <h2 className="text-lg font-bold">{c.nombre} {c.apellido}</h2>
              <p className="text-sm">Experiencia: {c.anios_experiencia ?? 0} año(s)</p>
              <p className="text-sm">Dirección: {c.direccion || "-"}</p>
              <p className="text-sm">Celular: {c.celular || "-"}</p>
              <div className="flex gap-2 mt-2">
                <Link to={`/dashboard/explorar/${c._id}`} className="px-3 py-1 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-700">
                  Ver perfil
                </Link>
                <Link to={`/dashboard/solicitar?carpintero=${c._id}`} className="px-3 py-1 text-sm bg-amber-700 text-white rounded-lg hover:bg-amber-800">
                  Solicitar proyecto
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Carpinteros