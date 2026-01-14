import { useState } from "react"
import { MdVisibility, MdVisibilityOff } from "react-icons/md"
import { Link } from "react-router"
import { useForm } from "react-hook-form"
import { ToastContainer } from 'react-toastify'
import { useFetch } from "../hooks/useFetch"
import logo_forget from '../../public/images/login.webp'



export const Register = () => {

    const [showPassword, setShowPassword] = useState(false)
    
    const fetchDataBackend = useFetch()
    const { register, handleSubmit, formState: { errors } } = useForm()
    
    const registerUser = async (dataForm) => {
        const url = `${import.meta.env.VITE_BACKEND_URL}/api/carpintero/registro`
        await fetchDataBackend(url, dataForm, "POST")
    }

    return (
        <div className="flex flex-col sm:flex-row min-h-screen">

            <ToastContainer />

            <div className="w-full sm:w-1/2 min-h-screen bg-white dark:bg-[#1e2939] flex justify-center items-center py-10">


                <div className="md:w-4/5 sm:w-full">

                    <h1 className="text-3xl font-semibold mb-2 text-center">Bienvenido(a)</h1>

                    <small className="text-gray-400 block my-4 text-sm text-center">Por favor ingresa tus datos</small> 
                    
                    {/* Formulario */}
                    <form onSubmit={handleSubmit(registerUser)}>

                        {/* Campo nombre */}
                        <div className="mb-3">
                            <label className="mb-2 block text-sm font-semibold">Nombre</label>
                            <input type="text" placeholder="Ingresa tu nombre" className="block w-full rounded-md border
                            border-gray-300  py-1 px-1.5 text-gray-500"
                            {...register("nombre", { required: "El nombre es obligatorio" })}
                            />
                            {errors.nombre && <p className="text-red-800">{errors.nombre.message}</p>}
                        </div>


                        {/* Campo apellido */}
                        <div className="mb-3">
                            <label className="mb-2 block text-sm font-semibold">Apellido</label>
                            <input type="text" placeholder="Ingresa tu apellido" className="block w-full rounded-md border
                            border-gray-300 py-1 px-1.5 text-gray-500"
                            {...register("apellido", { required: "El apellido es obligatorio" })}
                            />
                            {errors.apellido && <p className="text-red-800">{errors.apellido.message}</p>}
                        </div>


                        {/* Campo dirección */}
                        <div className="mb-3">
                            <label className="mb-2 block text-sm font-semibold">Dirección</label>
                            <input type="text" placeholder="Ingresa tu dirección de domicilio" className="block w-full 
                            rounded-md border border-gray-300 py-1 px-1.5 text-gray-500"
                            {...register("direccion", { required: "La direccion es obligatoria" })}
                            />
                            {errors.direccion && <p className="text-red-800">{errors.direccion.message}</p>}
                        </div>
                        

                        {/* Campo celular */}
                        <div className="mb-3">
                            <label className="mb-2 block text-sm font-semibold">Celular</label>
                            <input type="text" inputMode="tel" placeholder="Ingresa tu celular" className="block w-full 
                            rounded-md border border-gray-300 py-1 px-1.5 text-gray-500"
                            {...register("celular", { required: "El celular es obligatorio" })}
                            />
                            {errors.celular && <p className="text-red-800">{errors.celular.message}</p>}
                        </div>


                        {/* Campo correo electrónico */}
                        <div className="mb-3">
                            <label className="mb-2 block text-sm font-semibold">Correo electrónico</label>
                            <input type="email" placeholder="Ingresa tu correo electrónico" className="block w-full rounded-md 
                            border border-gray-300 py-1 px-1.5 text-gray-500"
                            {...register("email", { required: "El correo electrónico es obligatorio" })}
                            />
                            {errors.email && <p className="text-red-800">{errors.email.message}</p>}
                        </div>



                        {/* Campo Contraseña */}
                        <div className="mb-3">
                            
                            <label className="block text-sm font-semibold mb-1">Contraseña</label>

                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="************"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10"
                                    {...register("password", { required: "La contraseña es obligatoria" })}
                                />
                                {errors.password && <p className="text-red-800">{errors.password.message}</p>}

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-white"
                                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                >
                                    {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                                </button>
                            </div>
                        </div>


                        {/* Botón Register */}
                        <div className="mb-3">
                            <button className="bg-[#f59e0b] text-white border py-2 w-full rounded-xl mt-5 
                            hover:scale-105 duration-300 hover:bg-[#bb4d00] hover:text-white">Registrarse</button>
                        </div>


                    </form>


                    {/* Enlace para iniciar sesión si ya tiene una cuenta */}
                    <div className="mt-3 text-sm flex justify-between items-center">
                        <p>¿Ya posees una cuenta?</p>
                        <Link to="/login" className="py-2 px-5 bg-[#f59e0b] text-white border rounded-xl hover:scale-110 
                        duration-300 hover:bg-[#bb4d00]">Iniciar sesión</Link>
                    </div>

                </div>

            </div>

            {/* Imagen */}
            <div className="hidden sm:block sm:w-1/2">
                            <img 
                                src={logo_forget} 
                                alt="logo_login" 
                                className="w-full h-full object-cover"
                            />
                            </div>

        </div>
    )
}
