import { useEffect, useState } from "react"
import { Link } from "react-router"
import { ToastContainer, toast } from "react-toastify"
import storeAuth from "../../context/storeAuth"
import { detalleProyecto, listarMisProyectos, mensajeError } from "../../services/clienteService"
import ClienteNav from "../../components/cliente/ClienteNav"

const Proyecto = ({ p, onUnauthorized }) => {
  const [det, setDet] = useState(null)
  const [abierto, setAbierto] = useState(false)
  const [cargando, setCargando] = useState(false)

  const alternar = async () => {
    setAbierto((a) => !a)
    if (det || abierto) return
    setCargando(true)
    try {
      setDet(await detalleProyecto(p._id))
    } catch (e) {
      if (e.response?.status === 401) return onUnauthorized()
      toast.error(mensajeError(e, "No se pudo cargar el detalle"))
    } finally {
      setCargando(false)
    }
  }

  const estados = det?.estados || []
  const total = estados.reduce((s, e) => s + Number(e.precio || 0), 0)
  const pagado = estados.filter((e) => e.estadoPago === "Pagado").reduce((s, e) => s + Number(e.precio || 0), 0)
  const img = p.imagenProyectoIA || p.imagenProyecto

  return (
    <div className="bg-white rounded-lg shadow text-gray-800 overflow-hidden">
      <div className="p-5 flex flex-wrap gap-4 items-start">
        {img && <img src={img} alt={p.nombreProyecto} className="w-24 h-24 object-cover rounded" />}
        <div className="flex-1 min-w-[200px] space-y-1">
          <h2 className="text-lg font-bold">{p.nombreProyecto}</h2>
          <p className="text-sm">{p.descripcionProyecto}</p>
          <p className="text-sm text-gray-600">
            Carpintero: {p.carpintero?.nombre ? `${p.carpintero.nombre} ${p.carpintero.apellido}` : "-"}
            {" · "}Entrega: {p.fechaEntrega ? new Date(p.fechaEntrega).toLocaleDateString("es-EC", { timeZone: "UTC" }) : "-"}
          </p>
        </div>
        <button onClick={alternar} className="px-3 py-1 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-700">
          {abierto ? "Ocultar estado" : "Ver estado"}
        </button>
      </div>

      {abierto && (
        <div className="border-t border-gray-200 p-5">
          {cargando ? (
            <p className="text-sm text-gray-500">Cargando...</p>
          ) : estados.length === 0 ? (
            <p className="text-sm text-gray-500">El carpintero aún no ha registrado avances ni cobros para este proyecto.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full table-auto text-sm">
                  <thead className="bg-gray-800 text-slate-400">
                    <tr>{["Etapa", "Detalle", "Prioridad", "Precio", "Pago"].map((h) => <th key={h} className="p-2">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {estados.map((e) => (
                      <tr key={e._id} className="text-center hover:bg-gray-200">
                        <td className="px-2 py-1 text-left">{e.nombre}</td>
                        <td className="px-2 text-left">{e.detalle}</td>
                        <td>{e.prioridad}</td>
                        <td>$ {e.precio}</td>
                        <td className={e.estadoPago === "Pagado" ? "text-green-600" : "text-red-600"}>{e.estadoPago}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm mt-3">
                Total: <b>$ {total}</b> · Pagado: <b>$ {pagado}</b> · Pendiente: <b>$ {total - pagado}</b>
              </p>
              <Link to={`/dashboard/details/${p._id}`} className="inline-block mt-3 text-sm underline text-amber-700">
                Ir a pagar las etapas pendientes
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}

const MisProyectos = () => {
  const clearToken = storeAuth((s) => s.clearToken)
  const [lista, setLista] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      try {
        setLista(await listarMisProyectos())
      } catch (e) {
        if (e.response?.status === 401) return clearToken()
        toast.error(mensajeError(e, "No se pudieron cargar tus proyectos"))
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  return (
    <div>
      <ToastContainer />
      <h1 className="font-black text-4xl text-gray-500">Mis proyectos</h1>
      <hr className="my-4 border-t-2 border-gray-300" />
      <ClienteNav />

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : lista.length === 0 ? (
        <div className="p-4 text-sm text-red-800 rounded-lg bg-red-50">
          Aún no tienes proyectos. <Link to="/dashboard/solicitar" className="underline font-semibold">Solicita el primero</Link>
        </div>
      ) : (
        <div className="space-y-4 max-w-4xl">
          {lista.map((p) => <Proyecto key={p._id} p={p} onUnauthorized={clearToken} />)}
        </div>
      )}
    </div>
  )
}

export default MisProyectos