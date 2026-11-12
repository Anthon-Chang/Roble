import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router"
import { ToastContainer, toast } from "react-toastify"
import storeAuth from "../../context/storeAuth"
import { listarModelos, listarMuebles, mensajeError } from "../../services/clienteService"
import ClienteNav from "../../components/cliente/ClienteNav"

const Catalogo = () => {
  const clearToken = storeAuth((s) => s.clearToken)
  const [tab, setTab] = useState("modelos")
  const [modelos, setModelos] = useState([])
  const [muebles, setMuebles] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [mueble, setMueble] = useState(null)
  const [foto, setFoto] = useState(0)

  useEffect(() => {
    const cargar = async () => {
      try {
        const [m, f] = await Promise.all([listarModelos(), listarMuebles()])
        setModelos(m)
        setMuebles(f)
      } catch (e) {
        if (e.response?.status === 401) return clearToken()
        toast.error(mensajeError(e, "No se pudo cargar el catálogo"))
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  const t = q.trim().toLowerCase()
  const modelosF = useMemo(() => modelos.filter((m) => `${m.name} ${m.description || ""}`.toLowerCase().includes(t)), [modelos, t])
  const mueblesF = useMemo(() => muebles.filter((m) => `${m.nombre} ${m.descripcion || ""} ${m.categoria || ""}`.toLowerCase().includes(t)), [muebles, t])

  const tabCls = (v) =>
    `px-4 py-2 rounded-lg text-sm font-semibold border ${tab === v ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-700 border-gray-300"}`

  return (
    <div>
      <ToastContainer />
      <h1 className="font-black text-4xl text-gray-500">Catálogo</h1>
      <hr className="my-4 border-t-2 border-gray-300" />
      <ClienteNav />

      <div className="flex flex-wrap gap-3 items-center mb-6">
        <button className={tabCls("modelos")} onClick={() => setTab("modelos")}>Diseños 3D ({modelos.length})</button>
        <button className={tabCls("muebles")} onClick={() => setTab("muebles")}>Mobiliario ({muebles.length})</button>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar..."
          className="rounded-md border border-gray-300 px-3 py-2 text-gray-700 bg-white"
        />
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : tab === "modelos" ? (
        modelosF.length === 0 ? (
          <div className="p-4 text-sm text-red-800 rounded-lg bg-red-50">No hay modelos 3D publicados</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {modelosF.map((m) => (
              <div key={m._id} className="bg-white rounded-lg shadow p-5 text-gray-800 flex flex-col gap-2">
                <div className="flex justify-between items-start gap-2">
                  <h2 className="font-bold text-lg">{m.name}</h2>
                  <span className="text-xs uppercase bg-gray-200 rounded px-2 py-0.5">{m.formato || "3D"}</span>
                </div>
                <p className="text-sm line-clamp-3">{m.description || "Sin descripción"}</p>
                <Link to={`/dashboard/catalogo/modelo/${m._id}`} className="self-start mt-2 px-3 py-1 text-sm bg-amber-700 text-white rounded-lg hover:bg-amber-800">
                  Ver detalle
                </Link>
              </div>
            ))}
          </div>
        )
      ) : mueblesF.length === 0 ? (
        <div className="p-4 text-sm text-red-800 rounded-lg bg-red-50">No hay mobiliario publicado</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mueblesF.map((m) => (
            <div key={m._id} className="bg-white rounded-lg shadow overflow-hidden text-gray-800">
              {m.imagenes?.[0]
                ? <img src={m.imagenes[0].url} alt={m.nombre} className="w-full h-44 object-cover" />
                : <div className="w-full h-44 bg-gray-200 flex items-center justify-center text-gray-500 text-sm">Sin imagen</div>}
              <div className="p-4 space-y-1">
                <h2 className="font-bold text-lg">{m.nombre}</h2>
                <p className="text-sm">{m.tipoMadera ? `Madera: ${m.tipoMadera}` : ""}</p>
                {m.precio != null && <p className="text-sm font-semibold">$ {m.precio}</p>}
                <button onClick={() => { setMueble(m); setFoto(0) }} className="mt-2 px-3 py-1 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-700">
                  Ver detalle
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {mueble && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onMouseDown={(e) => e.target === e.currentTarget && setMueble(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 text-gray-800 max-h-[90vh] overflow-y-auto space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">{mueble.nombre}</h2>
              <button onClick={() => setMueble(null)} className="text-xl">✖</button>
            </div>
            {mueble.imagenes?.length > 0 && (
              <>
                <img src={mueble.imagenes[foto].url} alt={mueble.nombre} className="w-full max-h-80 object-contain rounded bg-gray-100" />
                <div className="flex gap-2 flex-wrap">
                  {mueble.imagenes.map((im, i) => (
                    <img key={im.path} src={im.url} alt="" onClick={() => setFoto(i)}
                      className={`w-16 h-16 object-cover rounded cursor-pointer border-2 ${i === foto ? "border-amber-700" : "border-transparent"}`} />
                  ))}
                </div>
              </>
            )}
            <p className="text-sm">{mueble.descripcion}</p>
            <ul className="text-sm space-y-1">
              {mueble.categoria && <li><b>Categoría:</b> {mueble.categoria}</li>}
              {mueble.tipoMadera && <li><b>Madera:</b> {mueble.tipoMadera}</li>}
              {mueble.precio != null && <li><b>Precio:</b> $ {mueble.precio}</li>}
              {(mueble.alto || mueble.ancho || mueble.profundidad) && (
                <li><b>Medidas (alto × ancho × prof.):</b> {mueble.alto ?? "-"} × {mueble.ancho ?? "-"} × {mueble.profundidad ?? "-"}</li>
              )}
            </ul>
            <div className="flex gap-2 pt-2">
              <Link to={`/dashboard/explorar/${mueble.carpintero}`} className="px-3 py-1 text-sm bg-gray-800 text-white rounded-lg">Ver carpintero</Link>
              <Link to={`/dashboard/solicitar?carpintero=${mueble.carpintero}`} className="px-3 py-1 text-sm bg-amber-700 text-white rounded-lg">Solicitar proyecto</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Catalogo