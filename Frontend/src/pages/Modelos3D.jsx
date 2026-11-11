import { useEffect, useState } from "react"
import { Link } from "react-router"
import { ToastContainer, toast } from "react-toastify"
import storeAuth from "../context/storeAuth"
import {
  actualizarModelo, crearModelo, eliminarModelo, listarMisModelos, mensajeError,
} from "../services/carpinteroService"
import CarpinteroNav from "../components/carpintero/CarpinteroNav"
import ThreeViewer from "../components/model3D/model3DViewer.jsx"

const EXTENSIONES = [".obj", ".glb", ".gltf"]
const MAX_MB = 50
const previsualizable = (m) => ["glb", "gltf"].includes(m.formato)

const Modal = ({ children, onClose, ancho = "max-w-md" }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div className={`bg-white rounded-xl shadow-xl ${ancho} w-full p-6 text-gray-800 max-h-[90vh] overflow-y-auto`}>{children}</div>
  </div>
)

// Sirve para crear (modelo = null) y para editar (modelo = objeto)
const FormularioModelo = ({ modelo, onClose, onSaved, onUnauthorized }) => {
  const [name, setName] = useState(modelo?.name || "")
  const [description, setDescription] = useState(modelo?.description || "")
  const [archivo, setArchivo] = useState(null)
  const [progreso, setProgreso] = useState(0)
  const [saving, setSaving] = useState(false)

  const elegirArchivo = (e) => {
    const f = e.target.files[0]
    if (!f) return setArchivo(null)
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase()
    if (!EXTENSIONES.includes(ext)) {
      toast.error("Formato no compatible: usa .obj, .glb o .gltf")
      e.target.value = ""
      return setArchivo(null)
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      toast.error(`El modelo no puede superar los ${MAX_MB} MB`)
      e.target.value = ""
      return setArchivo(null)
    }
    setArchivo(f)
  }

  const enviar = async (e) => {
    e.preventDefault()
    if (!name.trim()) return toast.error("El nombre es obligatorio")
    if (!modelo && !archivo) return toast.error("Debes seleccionar un archivo 3D")

    const form = new FormData()
    form.append("name", name.trim())
    form.append("description", description.trim())
    if (archivo) form.append("modelo", archivo)

    setSaving(true)
    try {
      const guardado = modelo
        ? await actualizarModelo(modelo._id, form, setProgreso)
        : await crearModelo(form, setProgreso)
      toast.success(modelo ? "Modelo actualizado" : "Modelo publicado")
      onSaved(guardado)
    } catch (error) {
      if (error.response?.status === 401) return onUnauthorized()
      toast.error(mensajeError(error, "No se pudo guardar el modelo"))
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full rounded-md border border-gray-300 px-2 py-1"

  return (
    <Modal onClose={saving ? () => {} : onClose}>
      <form onSubmit={enviar} className="space-y-4">
        <h2 className="text-xl font-bold">{modelo ? "Editar modelo 3D" : "Publicar modelo 3D"}</h2>

        <div>
          <label className="block text-sm font-semibold mb-1">Nombre</label>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Silla nórdica" />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Descripción</label>
          <textarea rows={3} className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">
            Archivo 3D {modelo && <span className="font-normal text-gray-500">(opcional: reemplaza el actual)</span>}
          </label>
          <input type="file" accept=".obj,.glb,.gltf" onChange={elegirArchivo} className={`${inputCls} text-gray-500`} />
          <p className="text-xs text-gray-500 mt-1">.obj, .glb o .gltf · máximo {MAX_MB} MB</p>
        </div>

        {saving && (
          <div className="w-full bg-gray-200 rounded h-2">
            <div className="bg-amber-700 h-2 rounded" style={{ width: `${progreso}%` }} />
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button type="button" disabled={saving} onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg">
            Cancelar
          </button>
          <button disabled={saving} className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50">
            {saving ? "Guardando..." : modelo ? "Guardar cambios" : "Publicar"}
          </button>
        </div>
      </form>
    </Modal>
  )
}

const Modelos3D = () => {
  const clearToken = storeAuth((s) => s.clearToken)
  const [modelos, setModelos] = useState([])
  const [loading, setLoading] = useState(true)
  const [noAprobado, setNoAprobado] = useState(false)
  const [form, setForm] = useState(null) // null | "nuevo" | modelo (edición)
  const [preview, setPreview] = useState(null)
  const [borrando, setBorrando] = useState(null)

  useEffect(() => {
    const cargar = async () => {
      try {
        setModelos(await listarMisModelos())
      } catch (error) {
        if (error.response?.status === 401) return clearToken()
        if (error.response?.status === 403) return setNoAprobado(true) // perfil no aprobado
        toast.error(mensajeError(error, "No se pudieron cargar tus modelos"))
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  const guardado = (m) => {
    setModelos((prev) => (prev.some((x) => x._id === m._id) ? prev.map((x) => (x._id === m._id ? m : x)) : [m, ...prev]))
    setForm(null)
  }

  const eliminar = async (m) => {
    if (!window.confirm(`¿Eliminar el modelo "${m.name}"? Esta acción no se puede deshacer.`)) return
    setBorrando(m._id)
    try {
      await eliminarModelo(m._id)
      setModelos((prev) => prev.filter((x) => x._id !== m._id))
      toast.success("Modelo eliminado")
    } catch (error) {
      if (error.response?.status === 401) return clearToken()
      toast.error(mensajeError(error, "No se pudo eliminar"))
    } finally {
      setBorrando(null)
    }
  }

  return (
    <div>
      <ToastContainer />
      <h1 className="font-black text-4xl text-gray-500">Mis modelos 3D</h1>
      <hr className="my-4 border-t-2 border-gray-300" />
      <CarpinteroNav />

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : noAprobado ? (
        <div className="p-4 rounded-lg bg-amber-50 text-amber-800 border border-amber-300 text-sm max-w-xl">
          Tu perfil aún no ha sido aprobado por el administrador, por eso no puedes publicar modelos.{" "}
          <Link to="/dashboard/estado-perfil" className="underline font-semibold">Ver estado del perfil</Link>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">{modelos.length} modelo(s) publicado(s)</p>
            <button onClick={() => setForm("nuevo")} className="px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-700">
              Subir modelo 3D
            </button>
          </div>

          {modelos.length === 0 ? (
            <div className="p-4 text-sm text-red-800 rounded-lg bg-red-50">Aún no has publicado modelos 3D.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto shadow-lg bg-white text-gray-800">
                <thead className="bg-gray-800 text-slate-400">
                  <tr>
                    {["N°", "Nombre", "Descripción", "Formato", "Publicado", "Acciones"].map((h) => (
                      <th key={h} className="p-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modelos.map((m, i) => (
                    <tr key={m._id} className="hover:bg-gray-300 text-center">
                      <td>{i + 1}</td>
                      <td className="px-2 py-1 text-left font-semibold">{m.name}</td>
                      <td className="px-2 text-left text-sm">{m.description || "-"}</td>
                      <td className="uppercase">{m.formato || "-"}</td>
                      <td>{m.createdAt ? new Date(m.createdAt).toLocaleDateString("es-EC") : "-"}</td>
                      <td className="py-2 space-x-2 whitespace-nowrap">
                        {previsualizable(m) ? (
                          <button onClick={() => setPreview(m)} className="px-3 py-1 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-700">
                            Ver
                          </button>
                        ) : (
                          <a href={m.modelUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-1 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-700">
                            Archivo
                          </a>
                        )}
                        <button onClick={() => setForm(m)} className="px-3 py-1 text-sm bg-amber-700 text-white rounded-lg hover:bg-amber-800">
                          Editar
                        </button>
                        <button
                          onClick={() => eliminar(m)}
                          disabled={borrando === m._id}
                          className="px-3 py-1 text-sm bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50"
                        >
                          {borrando === m._id ? "..." : "Eliminar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {form && (
        <FormularioModelo
          modelo={form === "nuevo" ? null : form}
          onClose={() => setForm(null)}
          onSaved={guardado}
          onUnauthorized={clearToken}
        />
      )}

      {preview && (
        <Modal onClose={() => setPreview(null)} ancho="max-w-3xl">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold">{preview.name}</h2>
            <button onClick={() => setPreview(null)} className="text-gray-600 text-xl">✖</button>
          </div>
          <ThreeViewer modelUrl={preview.modelUrl} />
        </Modal>
      )}
    </div>
  )
}

export default Modelos3D