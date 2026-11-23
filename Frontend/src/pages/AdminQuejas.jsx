import { useEffect, useState } from "react"
import { ToastContainer, toast } from "react-toastify"
import storeAuth from "../context/storeAuth"
import { detalleQueja, eliminarQueja, listarQuejas, mensajeError, seguimientoQueja } from "../services/quejaService"
import { listarUsuarios } from "../services/adminService"

const BADGE_ESTADO = {
  pendiente: "bg-yellow-100 text-yellow-800",
  en_seguimiento: "bg-blue-100 text-blue-800",
  resuelta: "bg-green-100 text-green-800",
}

const fecha = (f) => (f ? new Date(f).toLocaleString("es-EC") : "-")

const AdminQuejas = () => {
  const clearToken = storeAuth((s) => s.clearToken)
  const [quejas, setQuejas] = useState([])
  const [carpinteros, setCarpinteros] = useState({})
  const [loading, setLoading] = useState(true)
  const [tipo, setTipo] = useState("")
  const [estado, setEstado] = useState("")
  const [detalle, setDetalle] = useState(null)
  const [saving, setSaving] = useState(false)

  const manejarError = (error, porDefecto) => {
    if (error.response?.status === 401) return clearToken()
    toast.error(mensajeError(error, porDefecto))
  }

  const nombreCarpintero = (id) => {
    const c = carpinteros[id]
    return c ? `${c.nombre} ${c.apellido}` : "-"
  }

  useEffect(() => {
    listarUsuarios()
      .then((usuarios) => {
        const mapa = {}
        usuarios.filter((u) => u.rol === "carpintero").forEach((c) => { mapa[c._id] = c })
        setCarpinteros(mapa)
      })
      .catch((error) => manejarError(error, "No se pudo cargar la lista de carpinteros"))
  }, [])

  const cargar = async () => {
    setLoading(true)
    try {
      setQuejas(await listarQuejas({ tipo, estado }))
    } catch (error) {
      manejarError(error, "No se pudo cargar la lista")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [tipo, estado])

  const verDetalle = async (id) => {
    try {
      setDetalle(await detalleQueja(id))
    } catch (error) {
      manejarError(error, "No se pudo cargar el detalle")
    }
  }

  const cambiarEstado = async (nuevoEstado) => {
    setSaving(true)
    try {
      const data = await seguimientoQueja(detalle._id, nuevoEstado)
      setDetalle(data.queja)
      setQuejas((qs) => qs.map((q) => (q._id === data.queja._id ? data.queja : q)))
      toast.success(data.msg)
    } catch (error) {
      manejarError(error, "No se pudo actualizar el seguimiento")
    } finally {
      setSaving(false)
    }
  }

  const eliminar = async () => {
    if (!window.confirm("¿Eliminar este registro? Esta acción no se puede deshacer.")) return
    setSaving(true)
    try {
      const data = await eliminarQueja(detalle._id)
      setQuejas((qs) => qs.filter((q) => q._id !== detalle._id))
      toast.success(data.msg)
      setDetalle(null)
    } catch (error) {
      manejarError(error, "No se pudo eliminar")
    } finally {
      setSaving(false)
    }
  }

  const selectCls = "rounded-md border border-gray-300 px-3 py-2 text-gray-700 bg-white"
  const puedeEliminar = detalle && (detalle.tipo === "sugerencia" || detalle.estado === "resuelta")

  return (
    <div>
      <ToastContainer />
      <h1 className="font-black text-4xl text-gray-500">Quejas y sugerencias</h1>
      <hr className="my-4 border-t-2 border-gray-300" />

      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <label className="text-sm font-semibold">
          Tipo
          <select className={`${selectCls} block mt-1`} value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Todos</option>
            <option value="queja">Reclamos</option>
            <option value="sugerencia">Sugerencias</option>
          </select>
        </label>
        <label className="text-sm font-semibold">
          Estado
          <select className={`${selectCls} block mt-1`} value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_seguimiento">En seguimiento</option>
            <option value="resuelta">Resuelta</option>
          </select>
        </label>
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : quejas.length === 0 ? (
        <div className="p-4 text-sm text-red-800 rounded-lg bg-red-50">No hay registros con esos filtros</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto shadow-lg bg-white">
            <thead className="bg-gray-800 text-slate-400">
              <tr>
                {["N°", "Tipo", "Motivo", "Carpintero", "Estado", "Fecha", "Acciones"].map((h) => (
                  <th key={h} className="p-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quejas.map((q, i) => (
                <tr key={q._id} className="hover:bg-gray-300 text-center text-gray-800">
                  <td>{i + 1}</td>
                  <td className="capitalize">{q.tipo === "queja" ? "Reclamo" : "Sugerencia"}</td>
                  <td className="px-2 py-1 text-left max-w-xs truncate">{q.motivo}</td>
                  <td>{q.carpintero ? nombreCarpintero(q.carpintero) : "-"}</td>
                  <td>
                    {q.tipo === "queja" ? (
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded capitalize ${BADGE_ESTADO[q.estado]}`}>
                        {q.estado?.replace("_", " ")}
                      </span>
                    ) : "-"}
                  </td>
                  <td>{fecha(q.createdAt)}</td>
                  <td className="py-2">
                    <button className="px-3 py-1 text-sm bg-amber-700 text-white rounded-lg hover:bg-amber-800" onClick={() => verDetalle(q._id)}>
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 text-gray-800">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold capitalize">{detalle.tipo === "queja" ? "Reclamo" : "Sugerencia"}</h2>
              {detalle.tipo === "queja" && (
                <span className={`text-xs px-3 py-1 rounded capitalize ${BADGE_ESTADO[detalle.estado]}`}>
                  {detalle.estado?.replace("_", " ")}
                </span>
              )}
            </div>

            {detalle.carpintero && (
              <p className="text-sm"><b>Carpintero:</b> {nombreCarpintero(detalle.carpintero)}</p>
            )}
            <p className="text-sm whitespace-pre-wrap"><b>Detalle:</b> {detalle.motivo}</p>
            <p className="text-xs text-gray-500">Registrado: {fecha(detalle.createdAt)}</p>

            {detalle.evidenciaUrl && (
              <a href={detalle.evidenciaUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
                <img src={detalle.evidenciaUrl} alt="Evidencia" className="max-h-48 rounded-lg border" />
              </a>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              {detalle.tipo === "queja" && detalle.estado === "pendiente" && (
                <button disabled={saving} onClick={() => cambiarEstado("en_seguimiento")} className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50">
                  Marcar en seguimiento
                </button>
              )}
              {detalle.tipo === "queja" && detalle.estado !== "resuelta" && (
                <button disabled={saving} onClick={() => cambiarEstado("resuelta")} className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50">
                  Marcar resuelta
                </button>
              )}
              {puedeEliminar && (
                <button disabled={saving} onClick={eliminar} className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50">
                  Eliminar
                </button>
              )}
            </div>
            {detalle.tipo === "queja" && detalle.estado !== "resuelta" && (
              <p className="text-xs text-gray-500">Un reclamo solo se puede eliminar cuando esté resuelto.</p>
            )}

            <div className="flex justify-end">
              <button onClick={() => setDetalle(null)} className="px-4 py-2 border border-gray-300 rounded-lg">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminQuejas
