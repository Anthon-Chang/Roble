import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { ToastContainer, toast } from "react-toastify"
import storeAuth from "../context/storeAuth"
import { aprobarCarpintero, detalleCarpintero, rechazarCarpintero } from "../services/adminService"
import { BADGE } from "./AdminPanel"

const fecha = (f) => (f ? new Date(f).toLocaleString("es-EC") : "-")

const AdminCarpinteroDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const clearToken = storeAuth((s) => s.clearToken)
  const [c, setC] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState(false)
  const [motivo, setMotivo] = useState("")

  const manejarError = (error, porDefecto) => {
    if (error.response?.status === 401) return clearToken()
    toast.error(error.response?.data?.msg || porDefecto)
  }

  useEffect(() => {
    const cargar = async () => {
      try {
        setC(await detalleCarpintero(id))
      } catch (error) {
        manejarError(error, "No se pudo cargar el carpintero")
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [id])

  const aprobar = async () => {
    if (!window.confirm("¿Aprobar el perfil de este carpintero?")) return
    setSaving(true)
    try {
      const data = await aprobarCarpintero(id)
      setC(data.carpintero)
      toast.success(data.msg)
    } catch (error) {
      manejarError(error, "No se pudo aprobar")
    } finally {
      setSaving(false)
    }
  }

  const rechazar = async (e) => {
    e.preventDefault()
    if (!motivo.trim()) return toast.error("Debes indicar el motivo del rechazo")
    setSaving(true)
    try {
      const data = await rechazarCarpintero(id, motivo.trim())
      setC(data.carpintero)
      toast.success(data.msg)
      setModal(false)
      setMotivo("")
    } catch (error) {
      manejarError(error, "No se pudo rechazar")
    } finally {
      setSaving(false)
    }
  }

  // Descarga: si el navegador bloquea la descarga directa (CORS), abre el PDF en otra pestaña
  const descargarCV = async () => {
    try {
      const res = await fetch(c.cvUrl)
      if (!res.ok) throw new Error()
      const url = URL.createObjectURL(await res.blob())
      const a = document.createElement("a")
      a.href = url
      a.download = `CV-${c.nombre}-${c.apellido}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      window.open(c.cvUrl, "_blank", "noopener,noreferrer")
    }
  }

  if (loading) return <p className="text-gray-500">Cargando...</p>
  if (!c) {
    return (
      <div>
        <ToastContainer />
        <p className="text-red-800 mb-4">No se encontró el carpintero.</p>
        <button className="underline" onClick={() => navigate("/dashboard/admin")}>Volver</button>
      </div>
    )
  }

  const dato = (label, valor) => (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-semibold text-gray-800">{valor || "-"}</p>
    </div>
  )

  return (
    <div>
      <ToastContainer />
      <button className="text-sm underline mb-4" onClick={() => navigate("/dashboard/admin")}>
        ← Volver al panel
      </button>

      <div className="flex items-center gap-3 mb-2">
        <h1 className="font-black text-4xl text-gray-500">{c.nombre} {c.apellido}</h1>
        <span className={`text-sm px-3 py-1 rounded capitalize ${BADGE[c.estadoAprobacion]}`}>
          {c.estadoAprobacion}
        </span>
      </div>
      <hr className="my-4 border-t-2 border-gray-300" />

      <section className="bg-white rounded-lg shadow p-6 grid sm:grid-cols-2 gap-4 mb-6">
        {dato("Correo", c.email)}
        {dato("Celular", c.celular)}
        {dato("Dirección", c.direccion)}
        {dato("Años de experiencia", c.anios_experiencia)}
        {dato("Correo confirmado", c.confirmEmail ? "Sí" : "No")}
        {dato("Método de registro", c.provider === "google" ? "Google" : "Correo y contraseña")}
        {dato("Fecha de registro", fecha(c.createdAt))}
        {dato("CV actualizado", fecha(c.cvActualizado))}
      </section>

      {c.estadoAprobacion === "rechazado" && c.motivoRechazo && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-800 text-sm">
          <b>Motivo del rechazo:</b> {c.motivoRechazo}
        </div>
      )}

      <section className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Currículum (PDF)</h2>
        {c.cvUrl ? (
          <div className="flex flex-wrap gap-3">
            <a
              href={c.cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
            >
              Visualizar CV
            </a>
            <button onClick={descargarCV} className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800">
              Descargar CV
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-500">El carpintero aún no ha cargado su CV.</p>
        )}
      </section>

      <section className="flex flex-wrap gap-3">
        {c.estadoAprobacion !== "aprobado" && (
          <button
            onClick={aprobar}
            disabled={saving || !c.cvUrl}
            title={!c.cvUrl ? "No se puede aprobar sin CV" : ""}
            className="px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-50"
          >
            Aprobar perfil
          </button>
        )}
        {c.estadoAprobacion !== "rechazado" && (
          <button
            onClick={() => setModal(true)}
            disabled={saving}
            className="px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50"
          >
            Rechazar perfil
          </button>
        )}
      </section>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <form onSubmit={rechazar} className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 text-gray-800">
            <h2 className="text-xl font-bold">Rechazar perfil</h2>
            <p className="text-sm">Indica el motivo. Se enviará por correo al carpintero.</p>
            <textarea
              autoFocus
              rows={4}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: El CV está incompleto"
              className="w-full rounded-md border border-gray-300 p-2"
            />
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => { setModal(false); setMotivo("") }} className="px-4 py-2 border border-gray-300 rounded-lg">
                Cancelar
              </button>
              <button disabled={saving} className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50">
                {saving ? "Enviando..." : "Confirmar rechazo"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default AdminCarpinteroDetail