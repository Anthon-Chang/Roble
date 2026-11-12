import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { useForm } from "react-hook-form"
import { ToastContainer, toast } from "react-toastify"
import storeAuth from "../../context/storeAuth"
import { listarCarpinteros, mensajeError, solicitarProyecto } from "../../services/clienteService"
import ClienteNav from "../../components/cliente/ClienteNav"

const hoy = () => new Date().toISOString().slice(0, 10)
const inputCls = "block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-700 bg-white"

const SolicitarProyecto = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const clearToken = storeAuth((s) => s.clearToken)
  const [carpinteros, setCarpinteros] = useState([])
  const [imagen, setImagen] = useState(null)
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, setValue, formState: { errors } } = useForm()

  useEffect(() => {
    const cargar = async () => {
      try {
        const lista = await listarCarpinteros()
        setCarpinteros(lista)
        const pre = params.get("carpintero")
        if (pre && lista.some((c) => c._id === pre)) setValue("carpintero", pre)
      } catch (e) {
        if (e.response?.status === 401) return clearToken()
        toast.error(mensajeError(e, "No se pudo cargar la lista de carpinteros"))
      }
    }
    cargar()
  }, [])

  const elegirImagen = (e) => {
    const f = e.target.files[0]
    if (!f) return setImagen(null)
    if (![".jpg", ".jpeg", ".png", ".webp"].some((x) => f.name.toLowerCase().endsWith(x))) {
      toast.error("La imagen debe ser .jpg, .jpeg, .png o .webp")
      e.target.value = ""
      return setImagen(null)
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar los 5 MB")
      e.target.value = ""
      return setImagen(null)
    }
    setImagen(f)
  }

  const enviar = async (d) => {
    const form = new FormData()
    ;["carpintero", "nombreProyecto", "descripcionProyecto", "tipoMadera", "fechaEntrega"].forEach((k) => {
      if (d[k]?.trim()) form.append(k, d[k].trim())
    })
    if (imagen) form.append("imagenProyecto", imagen)

    setSaving(true)
    try {
      const r = await solicitarProyecto(form)
      toast.success(r.msg || "Proyecto generado")
      setTimeout(() => navigate("/dashboard/mis-proyectos"), 1200)
    } catch (e) {
      if (e.response?.status === 401) return clearToken()
      toast.error(mensajeError(e, "No se pudo solicitar el proyecto"))
      setSaving(false)
    }
  }

  return (
    <div>
      <ToastContainer />
      <h1 className="font-black text-4xl text-gray-500">Solicitar proyecto</h1>
      <hr className="my-4 border-t-2 border-gray-300" />
      <ClienteNav />

      <form onSubmit={handleSubmit(enviar)} className="bg-white rounded-lg shadow p-6 max-w-2xl space-y-4 text-gray-800">
        <div>
          <label className="mb-1 block text-sm font-semibold">Carpintero</label>
          <select className={inputCls} {...register("carpintero", { required: "Elige un carpintero" })}>
            <option value="">--- Seleccionar ---</option>
            {carpinteros.map((c) => (
              <option key={c._id} value={c._id}>{c.nombre} {c.apellido} ({c.anios_experiencia ?? 0} años)</option>
            ))}
          </select>
          {errors.carpintero && <p className="text-red-800">{errors.carpintero.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">Nombre del proyecto</label>
          <input className={inputCls} placeholder="Ej: Closet de 2 puertas" {...register("nombreProyecto", { required: "El nombre es obligatorio" })} />
          {errors.nombreProyecto && <p className="text-red-800">{errors.nombreProyecto.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">Descripción</label>
          <textarea rows={4} className={inputCls} placeholder="Describe medidas, estilo, uso..." {...register("descripcionProyecto", { required: "La descripción es obligatoria" })} />
          {errors.descripcionProyecto && <p className="text-red-800">{errors.descripcionProyecto.message}</p>}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold">Tipo de madera (opcional)</label>
            <input className={inputCls} placeholder="Roble, cedro..." {...register("tipoMadera")} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold">Fecha de entrega deseada</label>
            <input
              type="date"
              min={hoy()}
              className={inputCls}
              {...register("fechaEntrega", {
                required: "La fecha es obligatoria",
                validate: (v) => v >= hoy() || "La fecha no puede estar en el pasado",
              })}
            />
            {errors.fechaEntrega && <p className="text-red-800">{errors.fechaEntrega.message}</p>}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">Imagen de referencia (opcional)</label>
          <input type="file" accept="image/*" onChange={elegirImagen} className={`${inputCls} text-gray-500`} />
        </div>

        <button disabled={saving} className="px-6 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50">
          {saving ? "Enviando..." : "Enviar solicitud"}
        </button>
      </form>
    </div>
  )
}

export default SolicitarProyecto    