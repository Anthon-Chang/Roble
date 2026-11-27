import { useState } from "react"
import { toast } from "react-toastify"
import storeAuth from "../../context/storeAuth"
import { aprobarPropuesta, rechazarPropuesta, mensajeError, descargarArchivo } from "../../services/propuestaService"
import ThreeViewer from "../model3D/model3DViewer.jsx"

const BADGE = {
  Pendiente: "bg-yellow-100 text-yellow-700",
  Aprobada: "bg-green-100 text-green-700",
  Rechazada: "bg-red-100 text-red-700",
}

// Lista las propuestas de un proyecto (HU-011) y, si el usuario es el cliente dueño,
// permite aprobar o rechazar el modelo propuesto (HU-012).
const ListaPropuestas = ({ propuestas, onCambio }) => {
  const { rol } = storeAuth()
  const [idEnCurso, setIdEnCurso] = useState(null)
  const [motivo, setMotivo] = useState({})
  const [visorAbierto, setVisorAbierto] = useState({})

  const aprobar = async (id) => {
    setIdEnCurso(id)
    try {
      const { msg } = await aprobarPropuesta(id)
      toast.success(msg || "Propuesta aprobada")
      onCambio?.()
    } catch (error) {
      toast.error(mensajeError(error, "No se pudo aprobar la propuesta"))
    } finally {
      setIdEnCurso(null)
    }
  }

  const rechazar = async (id) => {
    setIdEnCurso(id)
    try {
      const { msg } = await rechazarPropuesta(id, motivo[id] || "")
      toast.success(msg || "Propuesta rechazada")
      onCambio?.()
    } catch (error) {
      toast.error(mensajeError(error, "No se pudo rechazar la propuesta"))
    } finally {
      setIdEnCurso(null)
    }
  }

  if (!propuestas || propuestas.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-600 rounded-lg bg-gray-50">
        Todavía no hay propuestas de diseño para este proyecto.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {propuestas.map((p) => (
        <div key={p._id} className="bg-white rounded-lg shadow p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1 rounded text-xs font-semibold ${BADGE[p.estado] || "bg-gray-100 text-gray-700"}`}>
              {p.estado}
            </span>
            {p.fechaCreacion && (
              <span className="text-xs text-gray-500">
                {new Date(p.fechaCreacion).toLocaleString("es-EC")}
              </span>
            )}
          </div>

          {p.description && <p className="text-sm text-gray-700">{p.description}</p>}

          {(() => {
            const previsualizable = ["glb", "gltf"].includes(p.formato)
            const abierto = !!visorAbierto[p._id]
            return (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  {previsualizable ? (
                    <button
                      onClick={() => setVisorAbierto((v) => ({ ...v, [p._id]: !v[p._id] }))}
                      className="px-4 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 text-sm"
                    >
                      {abierto ? "Ocultar visor 3D" : "Visualizar e interactuar"}
                    </button>
                  ) : (
                    <p className="text-xs text-amber-800 bg-amber-50 border border-amber-300 rounded-md px-2 py-1">
                      La vista interactiva solo está disponible para .glb y .gltf.
                    </p>
                  )}
                  <button
                    onClick={() => descargarArchivo(p.modelUrl, `propuesta.${p.formato || "glb"}`)}
                    className="px-4 py-1.5 bg-amber-700 text-white rounded-lg hover:bg-amber-800 text-sm"
                  >
                    Descargar modelo ({p.formato})
                  </button>
                </div>

                {abierto && previsualizable && (
                  <div className="max-w-xl">
                    <ThreeViewer modelUrl={p.modelUrl} />
                    <p className="text-xs text-gray-500 mt-2">Arrastra para rotar, usa la rueda para acercar y clic derecho para mover.</p>
                  </div>
                )}
              </>
            )
          })()}

          {p.estado === "Rechazada" && p.motivoRechazo && (
            <p className="text-sm text-red-700">Motivo de rechazo: {p.motivoRechazo}</p>
          )}

          {rol === "cliente" && p.estado === "Pendiente" && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                disabled={idEnCurso === p._id}
                onClick={() => aprobar(p._id)}
                className="px-4 py-1.5 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50"
              >
                Aprobar
              </button>
              <input
                type="text"
                placeholder="Motivo de rechazo (opcional)"
                value={motivo[p._id] || ""}
                onChange={(e) => setMotivo((m) => ({ ...m, [p._id]: e.target.value }))}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm flex-1 min-w-[160px]"
              />
              <button
                disabled={idEnCurso === p._id}
                onClick={() => rechazar(p._id)}
                className="px-4 py-1.5 bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50"
              >
                Rechazar
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default ListaPropuestas