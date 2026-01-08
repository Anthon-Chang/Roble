import { useState } from "react"
import { useNavigate } from "react-router"
import { useForm } from "react-hook-form"
import { generateAvatar, convertBlobToBase64 } from "../../helpers/consultarIA"
import { toast, ToastContainer } from "react-toastify"
import ThreeViewer from "../model3D/model3DViewer.jsx";

export const Form = () => {

    const [model3D, setModel3D] = useState({  
        prompt: "",
        loading: false,
        modelUrl: null
    });

    const [avatar, setAvatar] = useState({
        image:"",
        prompt: "",
        loading: false,
    });
    const navigate = useNavigate()
    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm()


    const selectedOption = watch("imageOption")


    const handleGenerateImage = async () => {

        setAvatar(prev => ({ ...prev, loading: true }))

        const blob = await generateAvatar(avatar.prompt)

        if (blob.type === "image/jpeg") {
            // blob:http://localhost/ea27cc7d-
            const imageUrl = URL.createObjectURL(blob)
            // data:image/png;base64,iVBORw0KGg
            const base64Image = await convertBlobToBase64(blob)
            setAvatar(prev => ({ ...prev, image: imageUrl, loading: false }))
            setValue("imagenProyectoIA", base64Image)
        }
        else {
            toast.error("Error al generar la imagen, vuelve a intentarlo dentro de 1 minuto");
            setAvatar(prev => ({ ...prev, image: "", loading: false }))
            setValue("imagenProyectoIA", avatar.image)
        }
    }
    // Función para manejar la generación de modelo 3D
    const handleGenerateModel3D = async () => {
    if (!model3D.prompt.trim()) return;

    try {
        setModel3D(prev => ({ ...prev, loading: true }));

        const API_URL = import.meta.env.VITE_BACKEND_URL;
        const response = await fetch(
            `${API_URL}/api/models/search?name=${encodeURIComponent(model3D.prompt)}`
        );

        const data = await response.json();

        if (!data.data) {
            toast.error("No se encontró un modelo 3D");
            setModel3D(prev => ({ ...prev, loading: false }));
            return;
        }

        setModel3D({
            prompt: model3D.prompt,
            loading: false,
            modelUrl: data.data.modelUrl
        });

        // Guardar el modelo 3D en el formulario
        setValue("modelo3DUrl", data.data.modelUrl);

    } catch (error) {
        console.error(error);
        toast.error("Error al buscar el modelo 3D");
        setModel3D(prev => ({ ...prev, loading: false }));
    }
};


    const registerProduct = async (dataForm) => {
        const formData = new FormData()
        Object.keys(dataForm).forEach((key) => {
            const value = dataForm[key]
            // archivo
            if (key === "imagenProyecto") {
                if (value && value[0]) formData.append("imagenProyecto", value[0])
                return
            }
            // omitir campos vacíos para no romper la validación del backend
            if (value === "" || value === undefined || value === null) return
            formData.append(key, value)
        })

        const url = `${import.meta.env.VITE_BACKEND_URL}/api/proyecto/registro`
        const storedUser = JSON.parse(localStorage.getItem("auth-token"))
        const token = storedUser?.state?.token
        try {
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            })

            const result = await res.json()
            if (res.ok) {
                toast.success(result.msg || "Registro exitoso")
                setTimeout(() => navigate("/dashboard/list"), 1500)
            } else {
                toast.error(result.msg || "Error en el registro")
            }
        } catch (error) {
            console.error(error)
            toast.error("Error al enviar los datos")
        }
    }
    return (

        <form onSubmit={handleSubmit(registerProduct)}>

            <ToastContainer />

            {/* Información del propietario */}
            <fieldset className="border-2 border-gray-300 p-6 rounded-lg shadow-lg">

                <legend className="text-xl font-bold text-gray-700 bg-gray-200 px-4 py-1 rounded-md">
                    Información del cliente
                </legend>

                {/* Cédula */}
                <div>
                    <label className="mb-2 block text-sm font-semibold">Cédula</label>
                    <div className="flex items-center gap-10 mb-5">
                        <input
                            type="number"
                            inputMode="numeric"
                            placeholder="Ingresa la cédula"
                            className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500"
                            {...register("cedulaCliente", { required: "La cédula es obligatoria" })}
                        />

                        <button className="py-1 px-8 bg-amber-700 text-white border rounded-xl 
                        duration-300 hover:bg-amber-800  hover:text-white sm:w-80">
                            Consultar
                        </button>
                    </div>
                    {errors.cedulaCliente && <p className="text-red-800">{errors.cedulaCliente.message}</p>}
                </div>



                {/* Campo nombres completos */}
                <div>
                    <label className="mb-2 block text-sm font-semibold">Nombres completos</label>
                    <input
                        type="text"
                        placeholder="Ingresa nombre y apellido"
                        className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                        {...register("nombreCliente", { required: "El nombre completo es obligatorio" })}
                    />
                    {errors.nombreCliente && <p className="text-red-800">{errors.nombreCliente.message}</p>}
                </div>


                {/* Campo correo electrónico */}
                <div>
                    <label className="mb-2 block text-sm font-semibold">Correo electrónico</label>
                    <input
                        type="email"
                        placeholder="Ingresa el correo electrónico"
                        className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                        {...register("emailCliente", { required: "El correo electrónico es obligatorio" })}
                    />
                    {errors.emailCliente && <p className="text-red-800">{errors.emailCliente.message}</p>}
                </div>


                {/* Campo celular */}
                <div>
                    <label className="mb-2 block text-sm font-semibold">Celular</label>
                    <input
                        type="text"
                        inputMode="tel"
                        placeholder="Ingresa el celular"
                        className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                        {...register("celularCliente", { required: "El celular es obligatorio" })}
                    />
                    {errors.celularCliente && <p className="text-red-800">{errors.celularCliente.message}</p>}
                </div>

            </fieldset>



            {/* Información del producto */}

            <fieldset className="border-2 border-gray-300 p-6 rounded-lg shadow-lg mt-10">

                <legend className="text-xl font-bold text-gray-700 bg-gray-200 px-4 py-1 rounded-md">
                    Información del producto
                </legend>


                {/* Campo nombre del producto */}
                <div>
                    <label className="mb-2 block text-sm font-semibold">Producto</label>
                    <input
                        type="text"
                        placeholder="Ingresar nombre del producto"
                        className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                        {...register("nombreProyecto", { required: "El nombre del producto es obligatorio" })}
                    />
                    {errors.nombreProyecto && <p className="text-red-800">{errors.nombreProyecto.message}</p>}
                </div>


                {/* Campo imagen del producto */}
                <label className="mb-2 block text-sm font-semibold">Imagen del producto</label>

                <div className="flex gap-4 mb-2">
                    {/* Opción: Imagen con IA */}
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            value="ia"
                            {...register("imageOption", { required: "El nombre del producto es obligatorio" })}
                        />
                        Generar con IA
                    </label>

                    {/* Opción: Subir Imagen */}
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            value="upload"
                            {...register("imageOption", { required: "Seleccione una opción para cargar la imagen" })}
                        />
                        Subir Imagen
                    </label>
                    {/* Opción: Generar modelo 3D */}
                    <label className="flex items-center gap-2">
                      <input
                          type="radio"
                          value="3d"
                          {...register("imageOption", { required: "Seleccione una opción" })}
                      />
                      Generar modelo 3D
                  </label>
                </div>
                {errors.imageOption && <p className="text-red-800">{errors.imageOption.message}</p>}



                {/* Campo imagen con IA */}
                {selectedOption === "ia" && (
                    <div className="mt-5">
                        <label className="mb-2 block text-sm font-semibold">Imagen con IA</label>
                            <div className="flex items-center gap-10 mb-5">
                                <input
                                    type="text"
                                    placeholder="Ingresa el prompt"
                                    className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500"
                                    value={avatar.prompt}
                                    onChange={(e) => setAvatar(prev => ({ ...prev, prompt: e.target.value }))}
                                />
                                <button
                                    type="button"
                                    className="py-1 px-8 bg-amber-700 text-white border rounded-xl hover:scale-110 duration-300 hover:bg-amber-800 hover:text-white sm:w-80"
                                    onClick={handleGenerateImage}
                                    disabled={avatar.loading}
                                >
                                    {avatar.loading ? "Generando..." : "Generar con IA"}
                                </button>
                            </div>
                        {avatar.image && (
                            <img src={avatar.image} alt="Avatar IA" width={500} height={500} />
                        )}
                    </div>
                )}


                {/* Campo subir imagen */}
                {selectedOption === "upload" && ( 
                  <div className="mt-5"> 
                  <label className="mb-2 block text-sm font-semibold">Subir Imagen</label>
                                                <input type="file"
                                                        accept="image/*"
                                                        className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                                                        {...register("imagenProyecto")}
                                                />
                  </div>  
                )}


                {/* Campo generar modelo 3D */}
                {selectedOption === "3d" && (
    <div className="mt-5 space-y-4">
        <label className="mb-2 block text-sm font-semibold">
            Modelo 3D
        </label>
        <div className="flex items-center gap-10 mb-5">
        <input
            type="text"
            placeholder="Ej: silla moderna, escritorio oficina"
            className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500"
            value={model3D.prompt}
            onChange={(e) =>
                setModel3D(prev => ({ ...prev, prompt: e.target.value }))
            }
        />
        <button
            type="button"
            className="py-1 px-8 bg-amber-700 text-white border rounded-xl hover:scale-110 duration-300 hover:bg-amber-800 hover:text-white sm:w-80"
            onClick={handleGenerateModel3D}
            disabled={model3D.loading}
        >
            {model3D.loading ? "Buscando modelo..." : "Buscar modelo 3D"}
        </button>
        </div>
        {/* VISOR 3D */}
        {model3D.modelUrl && (
            <div className="mt-6 border rounded-lg p-4 bg-gray-100 ">
                <ThreeViewer modelUrl={model3D.modelUrl} />
            </div>
        )}
    </div>
)}

                

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Campo precio del proyecto */}
                    <div>
                        <label htmlFor="precio" className="mb-2 block text-sm font-semibold">Precio</label>
                        <input
                            id="precio"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-700"
                            {...register("precioProyecto", { required: "El precio del proyecto es obligatorio" })}
                        />
                        {errors.precioProyecto && <p className="text-red-800">{errors.precioProyecto.message}</p>}
                    </div>

                    {/* Campo fecha de entrega */}
                    <div>
                        <label htmlFor="fechaContrato" className="mb-2 block text-sm font-semibold">Fecha de entrega</label>
                        <input
                            id="fechaContrato"
                            type="date"
                            className="block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-700"
                            {...register("fechaEntrega", { required: "La fecha de entrega es obligatoria" })}
                        />
                        {errors.fechaEntrega && <p className="text-red-800">{errors.fechaEntrega.message}</p>}
                    </div>
                </div>


                {/* Campo observación*/}
                <div>
                    <label className="mb-2 block text-sm font-semibold">Observación</label>
                    <textarea
                        placeholder="Ingresa el síntoma u observación de forma general"
                        className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                        {...register("descripcionProyecto", { required: "La observación del producto es obligatorio" })}
                    />
                    {errors.descripcionProyecto && <p className="text-red-800">{errors.descripcionProyecto.message}</p>}
                </div>

            </fieldset>

            {/* Campo oculto para enviar la URL del modelo 3D */}
            <input type="hidden" {...register("modelo3DUrl")} />
            {/* Campo oculto para enviar la imagen generada por IA en base64 (backend espera imagenProyectoIA) */}
            <input type="hidden" {...register("imagenProyectoIA")} />

            {/* Botón de registro */}
            <input
                type="submit"
                className="bg-amber-700 w-full p-2 mt-5 text-white uppercase font-bold rounded-lg 
                hover:bg-amber-800 cursor-pointer transition-all"
                value="Registrar"
            />

        </form>

    )
}