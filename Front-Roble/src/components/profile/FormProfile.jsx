import { useEffect } from "react"
import storeProfile from "../../context/storeProfile"
import { useForm } from "react-hook-form"
import { ToastContainer } from 'react-toastify'

const FormularioPerfil = () => {

    const { user,updateProfile } = storeProfile()
    const { register, handleSubmit, reset, formState: { errors } } = useForm()

    const updateUser = (dataForm) => {
        const url = `${import.meta.env.VITE_BACKEND_URL}/carpintero/actualizarperfil/${user._id}`
        updateProfile(url,dataForm)
    }

    useEffect(() => {
        if (user) {
            reset({
                nombre: user?.nombre,
                apellido: user?.apellido,
                direccion: user?.direccion,
                celular: user?.celular,
                email: user?.email,
            })
        }
    }, [user])

    return (

        <form onSubmit={handleSubmit(updateUser)}>

            <ToastContainer/>

            {/* Campo Nombre */}
            <div>
                <label className="mb-2 block text-sm font-semibold">Nombre</label>
                <input type="text" placeholder="Ingresa tu nombre" className="block w-full 
                rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                {...register("nombre", { required: "El nombre es obligatorio" })}
                />
                {errors.nombre && <p className="text-red-800">{errors.nombre.message}</p>}
            </div>
        
        
            {/* Campo Apellido */}
            <div>
                <label className="mb-2 block text-sm font-semibold">Apellido</label>
                <input type="text" placeholder="Ingresa tu apellido" className="block w-full 
                rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                {...register("apellido", { required: "El apellido es obligatorio" })}
                />
                {errors.apellido && <p className="text-red-800">{errors.apellido.message}</p>}
            </div>
        
        
            {/* Campo Dirección */}
            <div>
                <label className="mb-2 block text-sm font-semibold">Dirección</label>
                <input type="text" placeholder="Ingresa tu dirección" className="block w-full 
                rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                {...register("direccion", { required: "La dirección es obligatoria" })}
                />
                {errors.direccion && <p className="text-red-800">{errors.direccion.message}</p>}
            </div>
        
        
            {/* Campo Celular */}
            <div>
                <label className="mb-2 block text-sm font-semibold">Celular</label>
                <input type="text" inputMode="tel" placeholder="Ingresa tu teléfono" className="block w-full 
                rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                {...register("celular", { required: "El celular es obligatorio" })}
                />
                {errors.celular && <p className="text-red-800">{errors.celular.message}</p>}
            </div>
        
        
            {/* Campo Correo Electrónico */}
            <div>
                <label className="mb-2 block text-sm font-semibold">Correo electrónico</label>
                <input type="email" placeholder="Ingresa tu correo" className="block w-full 
                rounded-md border border-gray-300 py-1 px-2 text-gray-500 mb-5"
                {...register("email", { required: "El correo es obligatorio" })}
                />
                {errors.email && <p className="text-red-800">{errors.email.message}</p>}
            </div>


            {/* Botón para actualizar el perfil */}
            <input
                type="submit"
                className='bg-gray-800 w-full p-2 mt-5 text-slate-300 uppercase 
                font-bold rounded-lg hover:bg-gray-600 cursor-pointer transition-all'
                value='Actualizar'
            />

        </form>
    )
}

export default FormularioPerfil