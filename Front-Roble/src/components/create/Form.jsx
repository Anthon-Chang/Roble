/* eslint-disable react/prop-types */
import { useState, useEffect } from "react"
import { useFetch } from "../../hooks/useFetch"
import { useNavigate } from "react-router"
import { useForm } from "react-hook-form"
import { generateAvatar, convertBlobToBase64 } from "../../helpers/consultarIA"
import { toast, ToastContainer } from "react-toastify"
import ThreeViewer from "../model3D/model3DViewer.jsx";

export const Form = ({project}) => {

    const [model3D, setModel3D] = useState({
        prompt: "",
        loading: false,
        modelUrl: null
    });

    const [avatar, setAvatar] = useState({
        image: "",
        prompt: "",
        loading: false,
    });

    const navigate = useNavigate()
    const { register, handleSubmit, formState: { errors }, setValue, watch , reset } = useForm()
    const fetchDataBackend = useFetch()

    const selectedOption = watch("imageOption")

    const handleGenerateImage = async () => {
        if (!avatar.prompt.trim()) {
            toast.error("Ingresa un prompt para generar la imagen")
            return
        }

        setAvatar(prev => ({ ...prev, loading: true }))
        const blob = await generateAvatar(avatar.prompt)
        if (blob && blob.type?.includes("image")) {
            const imageUrl = URL.createObjectURL(blob)
            const base64Image = await convertBlobToBase64(blob)
            setAvatar(prev => ({ ...prev, image: imageUrl, loading: false }))
            setValue("imagenProyectoIA", base64Image)
        } else {
            toast.error("Error al generar la imagen, vuelve a intentarlo")
            setAvatar(prev => ({ ...prev, image: "", loading: false }))
            setValue("imagenProyectoIA", "")
        }
    }

    const handleGenerateModel3D = async () => {
        if (!model3D.prompt.trim()) return;
        try {
            setModel3D(prev => ({ ...prev, loading: true }));
            const API_URL = import.meta.env.VITE_BACKEND_URL;
            const response = await fetch(`${API_URL}/api/models/search?name=${encodeURIComponent(model3D.prompt)}`)
            const data = await response.json()
            if (!data.data) {
                toast.error("No se encontró un modelo 3D")
                setModel3D(prev => ({ ...prev, loading: false }))
                return
            }
            setModel3D({ prompt: model3D.prompt, loading: false, modelUrl: data.data.modelUrl })
            setValue("modelo3DUrl", data.data.modelUrl)
        } catch (error) {
            console.error(error)
            toast.error("Error al buscar el modelo 3D")
            setModel3D(prev => ({ ...prev, loading: false }))
        }
    }

    useEffect(() => {
    if (project) {
        reset({
            _id: project._id,
            cedulaCliente: project.cedulaCliente,
            nombreCliente: project.nombreCliente,
            emailCliente: project.emailCliente,
            celularCliente: project.celularCliente,
            nombreProyecto: project.nombreProyecto,
            precioProyecto: project.precioProyecto,
            fechaEntrega: new Date(project.fechaEntrega)
                .toLocaleDateString('en-CA', { timeZone: 'UTC' }),
            descripcionProyecto: project.descripcionProyecto,
            modelo3DUrl: project.modelo3DUrl,
            imageOption: "upload" 
        })
    }
}, [project, reset])


    const registerProject = async (dataForm) => {
    // Validaciones de imagen
    if (dataForm.imageOption === 'upload' && (!dataForm.imagenProyecto || dataForm.imagenProyecto.length === 0)) {
        toast.error('Debes seleccionar una imagen para subir')
        return
    }
    if (dataForm.imageOption === 'ia' && !dataForm.imagenProyectoIA) {
        toast.error('Genera la imagen con IA antes de enviar')
        return
    }

    const formData = new FormData()
    const allowedFields = [
        "cedulaCliente",
        "nombreCliente",
        "emailCliente",
        "celularCliente",
        "nombreProyecto",
        "precioProyecto",
        "fechaEntrega",
        "descripcionProyecto",
        "modelo3DUrl"
    ]

    allowedFields.forEach(field => {
        if (dataForm[field]) {
            formData.append(field, dataForm[field])
        }
    })

    // Imagen normal
    if (dataForm.imageOption === "upload" && dataForm.imagenProyecto?.[0]) {
        formData.append("imagenProyecto", dataForm.imagenProyecto[0])
    }

    // Imagen IA
    if (dataForm.imageOption === "ia" && dataForm.imagenProyectoIA) {
        formData.append("imagenProyectoIA", dataForm.imagenProyectoIA)
    }

    const storedUser = JSON.parse(localStorage.getItem("auth-token"))
    const headers = { Authorization: `Bearer ${storedUser?.state?.token}` }

    let response
    let url

    if (dataForm._id) {
        // 🔹 ACTUALIZAR PROYECTO
        url = `${import.meta.env.VITE_BACKEND_URL}/api/proyecto/actualizar/${dataForm._id}`
        response = await fetchDataBackend(url, formData, "PUT", headers, true)
    } else {
        // 🔹 REGISTRAR PROYECTO
        url = `${import.meta.env.VITE_BACKEND_URL}/api/proyecto/registro`
        response = await fetchDataBackend(url, formData, "POST", headers, true)
    }

    if (response) {
        setTimeout(() => navigate("/dashboard/list"), 1400)
    }

}

    return (
        <form onSubmit={handleSubmit(registerProject)}>
            <ToastContainer />

            <fieldset className="border-2 border-gray-300 p-6 rounded-lg shadow-lg">
                <legend className="text-xl font-bold text-gray-700 bg-gray-200 px-4 py-1 rounded-md">Información del cliente</legend>

                <div>
                    <label className="mb-2 block text-sm font-semibold">Cédula</label>
                    <div className="flex items-center gap-10 mb-5">
                        <input type="text" placeholder="Ingresa la cédula" className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500" {...register("cedulaCliente", { required: "La cédula es obligatoria" })} />
                        <button type="button" className="py-1 px-8 bg-amber-700 text-white border rounded-xl duration-300 hover:bg-amber-800  hover:text-white sm:w-80" disabled={project}>Consultar</button>
                    </div>
                    {errors.cedulaCliente && <p className="text-red-800">{errors.cedulaCliente.message}</p>}
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold">Nombres completos</label>
                    <input type="text" placeholder="Ingresa nombre y apellido" className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5" {...register("nombreCliente", { required: "El nombre completo es obligatorio" })} />
                    {errors.nombreCliente && <p className="text-red-800">{errors.nombreCliente.message}</p>}
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold">Correo electrónico</label>
                    <input type="email" placeholder="Ingresa el correo electrónico" className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5" {...register("emailCliente", { required: "El correo electrónico es obligatorio" })} />
                    {errors.emailCliente && <p className="text-red-800">{errors.emailCliente.message}</p>}
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold">Celular</label>
                    <input type="text" inputMode="tel" placeholder="Ingresa el celular" className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5" {...register("celularCliente", { required: "El celular es obligatorio" })} />
                    {errors.celularCliente && <p className="text-red-800">{errors.celularCliente.message}</p>}
                </div>
            </fieldset>

            <fieldset className="border-2 border-gray-300 p-6 rounded-lg shadow-lg mt-10">
                <legend className="text-xl font-bold text-gray-700 bg-gray-200 px-4 py-1 rounded-md">Información del proyecto</legend>

                <div>
                    <label className="mb-2 block text-sm font-semibold">Proyecto</label>
                    <input type="text" placeholder="Ingresar nombre del proyecto" className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5" {...register("nombreProyecto", { required: "El nombre del proyecto es obligatorio" })} disabled={project} />
                    {errors.nombreProyecto && <p className="text-red-800">{errors.nombreProyecto.message}</p>}
                </div>

                <label className="mb-2 block text-sm font-semibold">Imagen del proyecto</label>
                <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-2"><input type="radio" value="ia" {...register("imageOption", { required: "Seleccione una opción" })} /> Generar con IA</label>
                    <label className="flex items-center gap-2"><input type="radio" value="upload" {...register("imageOption", { required: "Seleccione una opción" })} /> Subir Imagen</label>
                    <label className="flex items-center gap-2"><input type="radio" value="3d" {...register("imageOption", { required: "Seleccione una opción" })} /> Generar modelo 3D</label>
                </div>
                {errors.imageOption && <p className="text-red-800">{errors.imageOption.message}</p>}

                {selectedOption === "ia" && (
                    <div className="mt-5">
                        <label className="mb-2 block text-sm font-semibold">Imagen con IA</label>
                        <div className="flex items-center gap-10 mb-5">
                            <input type="text" placeholder="Ingresa el prompt" className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500" value={avatar.prompt} onChange={(e) => setAvatar(prev => ({ ...prev, prompt: e.target.value }))} />
                            <button type="button" className="py-1 px-8 bg-amber-700 text-white border rounded-xl hover:scale-110 duration-300 hover:bg-amber-800 hover:text-white sm:w-80" onClick={handleGenerateImage} disabled={avatar.loading}>{avatar.loading ? "Generando..." : "Generar con IA"}</button>
                        </div>
                        {avatar.image && <img src={avatar.image} alt="Avatar IA" width={500} height={500} />}
                    </div>
                )}

                {selectedOption === "upload" && (
                    <div className="mt-5">
                        <label className="mb-2 block text-sm font-semibold">Subir Imagen</label>

                        <input
                        type="file"
                        accept="image/*"
                        className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                        onChange={(e) => {
                            const file = e.target.files[0]
                            if (file) {
                            setValue("imagenProyecto", e.target.files)   // 👈 esto es lo que faltaba
                            }
                        }}
                        />  
                    </div>
                    )}

                {selectedOption === "3d" && (
                    <div className="mt-5 space-y-4">
                        <label className="mb-2 block text-sm font-semibold">Modelo 3D</label>
                        <div className="flex items-center gap-10 mb-5">
                            <input type="text" placeholder="Ej: silla moderna" className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500" value={model3D.prompt} onChange={(e) => setModel3D(prev => ({ ...prev, prompt: e.target.value }))} />
                            <button type="button" className="py-1 px-8 bg-amber-700 text-white border rounded-xl hover:scale-110 duration-300 hover:bg-amber-800 hover:text-white sm:w-80" onClick={handleGenerateModel3D} disabled={model3D.loading}>{model3D.loading ? "Buscando modelo..." : "Buscar modelo 3D"}</button>
                        </div>
                        {model3D.modelUrl && <div className="mt-6 border rounded-lg p-4 bg-gray-100 "><ThreeViewer modelUrl={model3D.modelUrl} /></div>}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="precio" className="mb-2 block text-sm font-semibold">Precio</label>
                        <input id="precio" type="number" step="0.01" min="0" placeholder="0.00" className="block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-700" {...register("precioProyecto", { required: "El precio del proyecto es obligatorio" })} />
                        {errors.precioProyecto && <p className="text-red-800">{errors.precioProyecto.message}</p>}
                    </div>

                    <div>
                        <label htmlFor="fechaEntrega" className="mb-2 block text-sm font-semibold">Fecha de entrega</label>
                        <input id="fechaEntrega" type="date" className="block w-full rounded-md border border-gray-300 py-2 px-3 text-gray-700" {...register("fechaEntrega", { required: "La fecha de entrega es obligatoria" })} />
                        {errors.fechaEntrega && <p className="text-red-800">{errors.fechaEntrega.message}</p>}
                    </div>
                </div>

                <div>
                    <label className="mb-2 block text-sm font-semibold">Descripción</label>
                    <textarea placeholder="Ingresa una observación general" className="block w-full rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5" {...register("descripcionProyecto", { required: "La observación del proyecto es obligatoria" })} />
                    {errors.descripcionProyecto && <p className="text-red-800">{errors.descripcionProyecto.message}</p>}
                </div>
            </fieldset>

            <input type="hidden" {...register("imagenProyectoIA")} />
            <input type="hidden" {...register("modelo3DUrl")} />
            {project && <input type="hidden" {...register("_id")} />}


            <input type="submit" className="bg-amber-700 w-full p-2 mt-5 text-white uppercase font-bold rounded-lg hover:bg-amber-800 cursor-pointer transition-all" value={project ? "Actualizar" : "Registrar"} />
        </form>
    )
}