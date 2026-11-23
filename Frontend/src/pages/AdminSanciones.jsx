import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { ToastContainer, toast } from "react-toastify"
import storeAuth from "../context/storeAuth"
import { listarUsuarios } from "../services/adminService"
import { listarQuejas } from "../services/quejaService"
import { actualizarSancion, crearSancion, listarSanciones, mensajeError } from "../services/sancionService"
import { reglaTextoCorto } from "../helpers/validaciones"

const NIVELES = {
  retencion_pago: "Retención del pago",
  suspension_temporal: "Suspensión temporal",
  suspension_permanente: "Suspensión permanente",
}
const BADGE_ACTIVA = { true: "bg-red-100 text-red-800", false: "bg-gray-100 text-gray-600" }
const fecha = (f) => (f ? new Date(f).toLocaleString("es-EC") : "-")
const selectCls = "rounded-md border border-gray-300 px-3 py-2 text-gray-700 bg-white"
const inputCls = "block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-700 bg-white"

const AdminSanciones = () => {
  const clearToken = storeAuth((s) => s.clearToken)
  const [carpinteros, setCarpinteros] = useState([])
  const [quejas, setQuejas] = useState([])
  const [sanciones, setSanciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroCarpintero, setFiltroCarpintero] = useState("")
  const [modalCrear, setModalCrear] = useState(false)
  const [detalle, setDetalle] = useState(null)
  const [evidencia, setEvidencia] = useState(null)
  const [saving, setSaving] = useState(false)
  const [motivoEdit, setMotivoEdit] = useState("")

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm()
  const carpinteroElegido = watch("carpintero")
  const nivel = watch("nivel")

  const manejarError = (error, porDefecto) => {
    if (error.response?.status === 401) return clearToken()
    toast.error(mensajeError(error, porDefecto))
  }

  const nombreCarpintero = (id) => {
    const c = carpinteros.find((x) => x._id === id)
    return c ? `${c.nombre} ${c.apellido}` : "-"
  }

  const cargarSanciones = async () => {
    setLoading(true)
    try {
      setSanciones(await listarSanciones(filtroCarpintero || undefined))
    } catch (error) {
      manejarError(error, "No se pudo cargar la lista de sanciones")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    listarUsuarios()
      .then((usuarios) => setCarpinteros(usuarios.filter((u) => u.rol === "carpintero")))
      .catch((error) => manejarError(error, "No se pudo cargar la lista de carpinteros"))
    listarQuejas({ tipo: "queja" })
      .then(setQuejas)
      .catch((error) => manejarError(error, "No se pudo cargar la lista de reclamos"))
  }, [])

  useEffect(() => { cargarSanciones() }, [filtroCarpintero])

  const quejasDelCarpintero = useMemo(
    () => quejas.filter((q) => q.carpintero === carpinteroElegido),
    [quejas, carpinteroElegido]
  )

  const elegirEvidencia = (e) => {
    const f = e.target.files[0]
    if (!f) return setEvidencia(null)
    if (![".jpg", ".jpeg", ".png", ".webp"].some((x) => f.name.toLowerCase().endsWith(x))) {
      toast.error("La evidencia debe ser una imagen .jpg, .jpeg, .png o .webp")
      e.target.value = ""
      return setEvidencia(null)
    }
    setEvidencia(f)
  }

  const crear = async (d) => {
    const form = new FormData()
    form.append("carpintero", d.carpintero)
    form.append("motivo", d.motivo.trim())
    form.append("nivel", d.nivel)
    if (d.nivel === "suspension_temporal") form.append("diasSuspension", d.diasSuspension)
    if (d.quejaRelacionada) form.append("quejaRelacionada", d.quejaRelacionada)
    if (evidencia) form.append("evidencia", evidencia)

    setSaving(true)
    try {
      const data = await crearSancion(form)
      toast.success(data.msg)
      setModalCrear(false)
      reset()
      setEvidencia(null)
      cargarSanciones()
    } catch (error) {
      manejarError(error, "No se pudo registrar la sanción")
    } finally {
      setSaving(false)
    }
  }

  const abrirDetalle = (s) => {
    setDetalle(s)
    setMotivoEdit(s.motivo)
  }

  const guardarMotivo = async () => {
    if (!motivoEdit.trim()) return toast.error("El motivo no puede quedar vacío")
    setSaving(true)
    try {
      const data = await actualizarSancion(detalle._id, { motivo: motivoEdit.trim() })
      setDetalle(data.sancion)
      setSanciones((ss) => ss.map((s) => (s._id === data.sancion._id ? data.sancion : s)))
      toast.success(data.msg)
    } catch (error) {
      manejarError(error, "No se pudo actualizar el motivo")
    } finally {
      setSaving(false)
    }
  }

  const alternarActiva = async () => {
    setSaving(true)
    try {
      const data = await actualizarSancion(detalle._id, { activa: !detalle.activa })
      setDetalle(data.sancion)
      setSanciones((ss) => ss.map((s) => (s._id === data.sancion._id ? data.sancion : s)))
      toast.success(data.msg)
    } catch (error) {
      manejarError(error, "No se pudo actualizar la sanción")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <ToastContainer />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-black text-4xl text-gray-500">Sanciones</h1>
        <button onClick={() => setModalCrear(true)} className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800">
          + Nueva sanción
        </button>
      </div>
      <hr className="my-4 border-t-2 border-gray-300" />

      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <label className="text-sm font-semibold">
          Carpintero
          <select className={`${selectCls} block mt-1`} value={filtroCarpintero} onChange={(e) => setFiltroCarpintero(e.target.value)}>
            <option value="">Todos</option>
            {carpinteros.map((c) => (
              <option key={c._id} value={c._id}>{c.nombre} {c.apellido}</option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : sanciones.length === 0 ? (
        <div className="p-4 text-sm text-red-800 rounded-lg bg-red-50">No hay sanciones registradas</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto shadow-lg bg-white">
            <thead className="bg-gray-800 text-slate-400">
              <tr>
                {["N°", "Carpintero", "Nivel", "Motivo", "Estado", "Fecha", "Acciones"].map((h) => (
                  <th key={h} className="p-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sanciones.map((s, i) => (
                <tr key={s._id} className="hover:bg-gray-300 text-center text-gray-800">
                  <td>{i + 1}</td>
                  <td className="px-2 py-1 text-left">{nombreCarpintero(s.carpintero)}</td>
                  <td>{NIVELES[s.nivel] || s.nivel}</td>
                  <td className="px-2 py-1 text-left max-w-xs truncate">{s.motivo}</td>
                  <td>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${BADGE_ACTIVA[String(s.activa)]}`}>
                      {s.activa ? "Vigente" : "Revocada"}
                    </span>
                  </td>
                  <td>{fecha(s.createdAt)}</td>
                  <td className="py-2">
                    <button className="px-3 py-1 text-sm bg-amber-700 text-white rounded-lg hover:bg-amber-800" onClick={() => abrirDetalle(s)}>
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalCrear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 overflow-y-auto py-8">
          <form onSubmit={handleSubmit(crear)} className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 text-gray-800">
            <h2 className="text-xl font-bold">Registrar sanción</h2>

            <div>
              <label className="mb-1 block text-sm font-semibold">Carpintero</label>
              <select className={inputCls} {...register("carpintero", { required: "Elige un carpintero" })}>
                <option value="">--- Seleccionar ---</option>
                {carpinteros.map((c) => (
                  <option key={c._id} value={c._id}>{c.nombre} {c.apellido}</option>
                ))}
              </select>
              {errors.carpintero && <p className="text-red-800">{errors.carpintero.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">Nivel de la sanción</label>
              <select className={inputCls} {...register("nivel", { required: "Elige un nivel" })}>
                <option value="">--- Seleccionar ---</option>
                <option value="retencion_pago">Retención del pago</option>
                <option value="suspension_temporal">Suspensión temporal</option>
                <option value="suspension_permanente">Suspensión permanente</option>
              </select>
              {errors.nivel && <p className="text-red-800">{errors.nivel.message}</p>}
            </div>

            {nivel === "suspension_temporal" && (
              <div>
                <label className="mb-1 block text-sm font-semibold">Días de suspensión</label>
                <input type="number" min={1} step={1} className={inputCls}
                  {...register("diasSuspension", {
                    required: "Indica los días de suspensión",
                    min: { value: 1, message: "Debe ser mayor a 0" },
                    valueAsNumber: true,
                  })} />
                {errors.diasSuspension && <p className="text-red-800">{errors.diasSuspension.message}</p>}
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-semibold">Motivo</label>
              <textarea rows={4} className={inputCls} {...register("motivo", reglaTextoCorto("El motivo", 10, 500))} />
              {errors.motivo && <p className="text-red-800">{errors.motivo.message}</p>}
            </div>

            {carpinteroElegido && (
              <div>
                <label className="mb-1 block text-sm font-semibold">Reclamo relacionado (opcional)</label>
                <select className={inputCls} {...register("quejaRelacionada")}>
                  <option value="">Ninguno</option>
                  {quejasDelCarpintero.map((q) => (
                    <option key={q._id} value={q._id}>{q.motivo.slice(0, 60)}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-semibold">Evidencia (opcional)</label>
              <input type="file" accept="image/*" onChange={elegirEvidencia} className={`${inputCls} text-gray-500`} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setModalCrear(false); reset(); setEvidencia(null) }} className="px-4 py-2 border border-gray-300 rounded-lg">
                Cancelar
              </button>
              <button disabled={saving} className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50">
                {saving ? "Guardando..." : "Registrar"}
              </button>
            </div>
          </form>
        </div>
      )}

      {detalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 text-gray-800">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{NIVELES[detalle.nivel] || detalle.nivel}</h2>
              <span className={`text-xs px-3 py-1 rounded ${BADGE_ACTIVA[String(detalle.activa)]}`}>
                {detalle.activa ? "Vigente" : "Revocada"}
              </span>
            </div>
            <p className="text-sm"><b>Carpintero:</b> {nombreCarpintero(detalle.carpintero)}</p>
            {detalle.nivel === "suspension_temporal" && (
              <p className="text-sm"><b>Días de suspensión:</b> {detalle.diasSuspension} · <b>Finaliza:</b> {fecha(detalle.finSuspension)}</p>
            )}
            {detalle.evidenciaUrl && (
              <a href={detalle.evidenciaUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-amber-700 underline block">
                Ver evidencia
              </a>
            )}
            <p className="text-xs text-gray-500">Registrada: {fecha(detalle.createdAt)}</p>

            <div>
              <label className="mb-1 block text-sm font-semibold">Motivo</label>
              <textarea rows={4} className={inputCls} value={motivoEdit} onChange={(e) => setMotivoEdit(e.target.value)} />
              <button disabled={saving || motivoEdit.trim() === detalle.motivo} onClick={guardarMotivo} className="mt-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 text-sm">
                Guardar motivo
              </button>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button disabled={saving} onClick={alternarActiva} className={`px-4 py-2 rounded-lg text-white disabled:opacity-50 ${detalle.activa ? "bg-red-700 hover:bg-red-800" : "bg-green-700 hover:bg-green-800"}`}>
                {detalle.activa ? "Revocar sanción" : "Reactivar sanción"}
              </button>
              <button onClick={() => setDetalle(null)} className="px-4 py-2 border border-gray-300 rounded-lg">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminSanciones
