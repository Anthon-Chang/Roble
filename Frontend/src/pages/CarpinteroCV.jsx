import { useEffect, useState } from "react"
import { Link } from "react-router"
import { ToastContainer, toast } from "react-toastify"
import storeAuth from "../context/storeAuth"
import { guardarCV, obtenerMiCV, mensajeError } from "../services/carpinteroService"
import CarpinteroNav, { BADGE } from "../components/carpintero/CarpinteroNav"

const MAX_MB = 5

const CarpinteroCV = () => {
  const clearToken = storeAuth((s) => s.clearToken)
  const [cv, setCv] = useState(null) // null = aún no hay CV
  const [loading, setLoading] = useState(true)
  const [archivo, setArchivo] = useState(null)
  const [progreso, setProgreso] = useState(0)
  const [saving, setSaving] = useState(false)
  const [inputKey, setInputKey] = useState(0) // para limpiar el input file

  const cargar = async () => {
    try {
      setCv(await obtenerMiCV())
    } catch (error) {
      if (error.response?.status === 401) return clearToken()
      if (error.response?.status === 404) return setCv(null) // todavía no sube CV
      toast.error(mensajeError(error, "No se pudo consultar tu CV"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const elegirArchivo = (e) => {
    const f = e.target.files[0]
    if (!f) return setArchivo(null)
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      toast.error("El CV debe estar en formato .pdf")
      e.target.value = ""
      return setArchivo(null)
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      toast.error(`El CV no puede superar los ${MAX_MB} MB`)
      e.target.value = ""
      return setArchivo(null)
    }
    setArchivo(f)
  }

  const enviar = async (e) => {
    e.preventDefault()
    if (!archivo) return toast.error("Selecciona un archivo PDF")
    setSaving(true)
    setProgreso(0)
    try {
      const data = await guardarCV(archivo, Boolean(cv), setProgreso)
      toast.success(data.msg || "CV guardado")
      setArchivo(null)
      setInputKey((k) => k + 1)
      await cargar()
    } catch (error) {
      if (error.response?.status === 401) return clearToken()
      toast.error(mensajeError(error, "No se pudo guardar el CV"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <ToastContainer />
      <h1 className="font-black text-4xl text-gray-500">Mi currículum</h1>
      <hr className="my-4 border-t-2 border-gray-300" />
      <CarpinteroNav />

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6 max-w-5xl text-gray-800">
          {/* Consultar CV */}
          <section className="bg-white rounded-lg shadow p-6 space-y-3">
            <h2 className="text-xl font-semibold text-gray-700">CV cargado</h2>
            {cv ? (
              <>
                <p className="text-sm">
                  Estado del perfil:{" "}
                  <span className={`px-2 py-0.5 rounded capitalize ${BADGE[cv.estadoAprobacion]}`}>
                    {cv.estadoAprobacion}
                  </span>
                </p>
                <p className="text-sm">
                  Última actualización: {cv.cvActualizado ? new Date(cv.cvActualizado).toLocaleString("es-EC") : "-"}
                </p>
                <a
                  href={cv.cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
                >
                  Visualizar CV
                </a>
              </>
            ) : (
              <p className="text-sm text-gray-500">Aún no has cargado tu CV.</p>
            )}
            <p className="text-sm pt-2">
              <Link to="/dashboard/estado-perfil" className="underline">Ver estado de aprobación</Link>
            </p>
          </section>

          {/* Subir / actualizar */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-3">{cv ? "Actualizar CV" : "Subir CV"}</h2>
            <form onSubmit={enviar} className="space-y-4">
              <input
                key={inputKey}
                type="file"
                accept="application/pdf,.pdf"
                onChange={elegirArchivo}
                className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500"
              />
              <p className="text-xs text-gray-500">Solo PDF, máximo {MAX_MB} MB.</p>

              {cv?.estadoAprobacion === "rechazado" && (
                <p className="text-xs rounded-md bg-amber-50 text-amber-800 border border-amber-300 p-2">
                  Tu perfil fue rechazado. Al subir un CV nuevo volverá a quedar en revisión.
                </p>
              )}

              {saving && (
                <div className="w-full bg-gray-200 rounded h-2">
                  <div className="bg-amber-700 h-2 rounded" style={{ width: `${progreso}%` }} />
                </div>
              )}

              <button
                disabled={saving || !archivo}
                className="px-5 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50"
              >
                {saving ? "Subiendo..." : cv ? "Actualizar CV" : "Subir CV"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default CarpinteroCV