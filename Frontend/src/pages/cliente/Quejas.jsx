import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { ToastContainer, toast } from "react-toastify"
import storeAuth from "../../context/storeAuth"
import { listarCarpinteros, mensajeError } from "../../services/clienteService"
import { crearQueja } from "../../services/quejaService"
import ClienteNav from "../../components/cliente/ClienteNav"
import { reglaTextoCorto } from "../../helpers/validaciones"

const inputCls = "block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-700 bg-white"

const Quejas = () => {
  const clearToken = storeAuth((s) => s.clearToken)
  const [carpinteros, setCarpinteros] = useState([])
  const [evidencia, setEvidencia] = useState(null)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({ defaultValues: { tipo: "queja" } })
  const tipo = watch("tipo")

  useEffect(() => {
    const cargar = async () => {
      try {
        setCarpinteros(await listarCarpinteros())
      } catch (e) {
        if (e.response?.status === 401) return clearToken()
        toast.error(mensajeError(e, "No se pudo cargar la lista de carpinteros"))
      }
    }
    cargar()
  }, [])

  const elegirEvidencia = (e) => {
    const f = e.target.files[0]
    if (!f) return setEvidencia(null)
    if (![".jpg", ".jpeg", ".png", ".webp"].some((x) => f.name.toLowerCase().endsWith(x))) {
      toast.error("La evidencia debe ser una imagen .jpg, .jpeg, .png o .webp")
      e.target.value = ""
      return setEvidencia(null)
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar los 5 MB")
      e.target.value = ""
      return setEvidencia(null)
    }
    setEvidencia(f)
  }

  const enviar = async (d) => {
    const form = new FormData()
    form.append("tipo", d.tipo)
    form.append("motivo", d.motivo.trim())
    if (d.tipo === "queja") form.append("carpintero", d.carpintero)
    if (evidencia) form.append("evidencia", evidencia)

    setSaving(true)
    try {
      const r = await crearQueja(form)
      toast.success(r.msg || "Registrado correctamente")
      reset({ tipo: "queja", motivo: "", carpintero: "" })
      setEvidencia(null)
    } catch (e) {
      if (e.response?.status === 401) return clearToken()
      toast.error(mensajeError(e, "No se pudo registrar"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <ToastContainer />
      <h1 className="font-black text-4xl text-gray-500">Quejas y sugerencias</h1>
      <hr className="my-4 border-t-2 border-gray-300" />
      <ClienteNav />

      <form onSubmit={handleSubmit(enviar)} className="bg-white rounded-lg shadow p-6 max-w-2xl space-y-4 text-gray-800">
        <div>
          <label className="mb-1 block text-sm font-semibold">Tipo</label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" value="queja" {...register("tipo", { required: true })} /> Reclamo sobre un carpintero
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" value="sugerencia" {...register("tipo", { required: true })} /> Sugerencia general
            </label>
          </div>
        </div>

        {tipo === "queja" && (
          <div>
            <label className="mb-1 block text-sm font-semibold">Carpintero</label>
            <select className={inputCls} {...register("carpintero", { required: tipo === "queja" ? "Elige un carpintero" : false })}>
              <option value="">--- Seleccionar ---</option>
              {carpinteros.map((c) => (
                <option key={c._id} value={c._id}>{c.nombre} {c.apellido}</option>
              ))}
            </select>
            {errors.carpintero && <p className="text-red-800">{errors.carpintero.message}</p>}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-semibold">
            {tipo === "queja" ? "Describe el problema" : "Cuéntanos tu sugerencia"}
          </label>
          <textarea rows={5} className={inputCls} placeholder="Escribe los detalles..."
            {...register("motivo", reglaTextoCorto(tipo === "queja" ? "El motivo" : "La sugerencia", 10, 500))} />
          {errors.motivo && <p className="text-red-800">{errors.motivo.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">Evidencia (opcional)</label>
          <input type="file" accept="image/*" onChange={elegirEvidencia} className={`${inputCls} text-gray-500`} />
        </div>

        <button disabled={saving} className="px-6 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50">
          {saving ? "Enviando..." : "Enviar"}
        </button>
      </form>
    </div>
  )
}

export default Quejas
