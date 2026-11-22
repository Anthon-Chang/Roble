import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "react-toastify"
import { enviarPropuesta, mensajeError } from "../../services/propuestaService"

const FORMATOS_VALIDOS = [".obj", ".glb", ".gltf"]

// Formulario del carpintero aprobado para enviar una propuesta de diseño 3D (HU-011)
// sobre un proyecto del que es dueño.
const FormPropuesta = ({ proyectoId, onEnviada }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  const [progreso, setProgreso] = useState(0)
  const [enviando, setEnviando] = useState(false)

  const onSubmit = async (dataForm) => {
    const archivo = dataForm.modelo?.[0]
    if (!archivo) return toast.error("Debes seleccionar un archivo 3D (.obj, .glb o .gltf)")

    const extension = `.${archivo.name.split(".").pop().toLowerCase()}`
    if (!FORMATOS_VALIDOS.includes(extension)) {
      return toast.error(`Formato no permitido. Usa: ${FORMATOS_VALIDOS.join(", ")}`)
    }

    setEnviando(true)
    setProgreso(0)
    try {
      const { msg } = await enviarPropuesta(
        { proyectoId, description: dataForm.description, archivo },
        setProgreso
      )
      toast.success(msg || "Propuesta enviada correctamente")
      reset()
      onEnviada?.()
    } catch (error) {
      toast.error(mensajeError(error, "No se pudo enviar la propuesta"))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow p-5 space-y-4 max-w-xl">
      <h2 className="font-bold text-lg text-gray-700">Enviar propuesta de diseño 3D</h2>

      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-600">
          Descripción (opcional)
        </label>
        <textarea
          placeholder="Notas sobre la propuesta"
          className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-700"
          {...register("description")}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-600">
          Archivo 3D (.obj, .glb, .gltf)
        </label>
        <input
          type="file"
          accept=".obj,.glb,.gltf"
          className="block w-full text-sm text-gray-600"
          {...register("modelo", { required: "Debes adjuntar el archivo del modelo" })}
        />
        {errors.modelo && <p className="text-red-600 text-sm">{errors.modelo.message}</p>}
      </div>

      {enviando && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-amber-600 h-2 rounded-full" style={{ width: `${progreso}%` }} />
        </div>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="px-5 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50"
      >
        {enviando ? `Enviando... ${progreso}%` : "Enviar propuesta"}
      </button>
    </form>
  )
}

export default FormPropuesta