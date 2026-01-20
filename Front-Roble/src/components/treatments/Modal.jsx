import { useForm } from "react-hook-form"
import storeTreatments from "../../context/storEstado"

const ModalTreatments = ({ proyectoID }) => {

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm()

    const { toggleModal, registerTreatments } = storeTreatments()

    const registerTreatmentsForm = (dataForm) => {

        if (!proyectoID) {
            console.error("❌ proyectoID no recibido")
            return
        }

        const url = `${import.meta.env.VITE_BACKEND_URL}/api/estado/registro`

        const newData = {
            ...dataForm,
            precio: Number(dataForm.precio),
            estadoPago: "Pendiente",
            proyecto: proyectoID
        }

        registerTreatments(url, newData)
        reset()
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center">

            <div className="bg-gray-800 rounded-lg shadow-lg overflow-y-auto  max-w-lg w-full border border-gray-700 relative">

                <p className="text-white font-bold text-lg text-center mt-4">
                    Registro de estado
                </p>

                <form className="p-10" onSubmit={handleSubmit(registerTreatmentsForm)}>

                    {/* Nombre */}
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-50">
                            Nombre
                        </label>
                        <input
                            type="text"
                            placeholder="Ingresa el nombre"
                            className="block w-full rounded-md border border-gray-300 py-1 px-2
                            text-gray-500 mb-5 bg-gray-50"
                            {...register("nombre", { required: "El nombre es obligatorio" })}
                        />
                        {errors.nombre && (
                            <p className="text-red-600">{errors.nombre.message}</p>
                        )}
                    </div>

                    {/* Detalle */}
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-50">
                            Detalle
                        </label>
                        <textarea
                            placeholder="Ingresa el detalle"
                            className="block w-full rounded-md border border-gray-300 py-1 px-2
                            text-gray-500 mb-5 bg-gray-50"
                            {...register("detalle", { required: "El detalle es obligatorio" })}
                        />
                        {errors.detalle && (
                            <p className="text-red-600">{errors.detalle.message}</p>
                        )}
                    </div>

                    {/* Prioridad */}
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-50">
                            Prioridad
                        </label>
                        <select
                            className="block w-full rounded-md border border-gray-300 py-1 px-2
                            text-gray-500 mb-5 bg-gray-50"
                            {...register("prioridad", { required: "La prioridad es obligatoria" })}
                        >
                            <option value="">--- Seleccionar ---</option>
                            <option value="Baja">Baja</option>
                            <option value="Media">Media</option>
                            <option value="Alta">Alta</option>
                        </select>
                        {errors.prioridad && (
                            <p className="text-red-600">{errors.prioridad.message}</p>
                        )}
                    </div>

                    {/* Precio */}
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-50">
                            Precio
                        </label>
                        <input
                            type="number"
                            min="1"
                            placeholder="Ingresa el precio"
                            className="block w-full rounded-md border border-gray-300 py-1 px-2
                            text-gray-500 mb-5 bg-gray-50"
                            {...register("precio", {
                                required: "El precio es obligatorio",
                                min: { value: 1, message: "El precio debe ser mayor a 0" }
                            })}
                        />
                        {errors.precio && (
                            <p className="text-red-600">{errors.precio.message}</p>
                        )}
                    </div>

                    {/* Botones */}
                    <div className="flex justify-center gap-5">
                        <input
                            type="submit"
                            value="Registrar"
                            className="bg-green-700 px-6 py-2 rounded-lg text-white hover:bg-green-900 cursor-pointer"
                        />

                        <button
                            type="button"
                            onClick={toggleModal}
                            className="bg-red-700 px-6 py-2 rounded-lg text-white hover:bg-red-900"
                        >
                            Cancelar
                        </button>
                    </div>

                </form>
            </div>
        </div>
    )
}

export default ModalTreatments
