import { useState } from "react"
import { MdVisibility, MdVisibilityOff } from "react-icons/md"
import { Link, useNavigate } from "react-router"
import {useFetch} from '../hooks/useFetch'
import { ToastContainer } from 'react-toastify'
import { useForm } from 'react-hook-form'
import storeAuth from "../context/storeAuth"
import logo from '../../public/images/login_2.webp'



const Login = () => {
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate()
    const { register, handleSubmit, formState: { errors } } = useForm()
    const  fetchDataBackend = useFetch()
    const { setToken, setRol } = storeAuth()    

    const loginUser = async(dataForm) => {
        let url = " "
        let body = {}
        if (dataForm.password.includes("CLI")){
            url = `${import.meta.env.VITE_BACKEND_URL}/api/proyecto/login`
            body = {
            emailCliente: dataForm.email,
            passwordCliente: dataForm.password
        }
        }else{
            url = `${import.meta.env.VITE_BACKEND_URL}/api/carpintero/login`
            body = {
            email: dataForm.email,
            password: dataForm.password
        }
        }
            
            
        const response = await fetchDataBackend(url, body,'POST')
        setToken(response.token)
        setRol(response.rol)
        if(response){
            navigate('/dashboard')
        }
    }

    return (
    <div className="relative h-screen w-full flex justify-center items-center">
    {/* Imagen de fondo */}
    <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${logo})`, opacity: 0.7 }} // Ajusta 0.3 a tu gusto
    />

    {/* Contenido encima */}
    <ToastContainer />

        <div className="w-11/12 sm:w-150 min-h-[700px] bg-white/80 dark:bg-[#1e2939]/80 p-8 rounded-xl shadow-xl backdrop-blur flex flex-col items-left justify-center">



            <h1 className="text-3xl font-semibold text-center">Bienvenido(a)</h1>
            <p className="text-gray-600 dark:text-gray-300 text-center my-4">
                Por favor ingresa tus datos
            </p>

            {/* Formulario */}
            <form onSubmit={handleSubmit(loginUser)}>

                {/* Correo */}
                <div className="mb-3">
                    <label className="block text-sm font-semibold mb-1">Correo electrónico</label>
                    <input
                        type="email"
                        placeholder="Ingresa tu correo"
                        className="w-full rounded-md border border-gray-300 focus:ring-1 px-2 py-1"
                        {...register("email", { required: "El correo es obligatorio" })}
                    />
                    {errors.email && <p className="text-red-800">{errors.email.message}</p>}
                </div>

                {/* Contraseña */}
                <div className="mb-3">
                    <label className="block text-sm font-semibold mb-1">Contraseña</label>

                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="************"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 "
                            {...register("password", { required: "La contraseña es obligatoria" })}
                        />
                        {errors.password && <p className="text-red-800">{errors.password.message}</p>}

                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                        >
                            {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                        </button>
                    </div>
                </div>

                {/* Botón login */}
                <button className="py-2 w-full bg-[#f59e0b] text-white rounded-xl 
                    hover:bg-[#bb4d00] transition">
                    Iniciar sesión
                </button>

            </form>

            {/* Separador */}
            <div className="mt-6 flex items-center text-gray-500">
                <hr className="flex-1" />
                <span className="px-2 text-sm">O</span>
                <hr className="flex-1" />
            </div>

            {/* Google */}
            <button className="w-full mt-5 flex items-center justify-center border py-2 rounded-xl text-sm hover:bg-[#bb4d00] hover:text-white">
                <img className="w-5 mr-2" src="https://cdn-icons-png.flaticon.com/512/281/281764.png" />
                Iniciar sesión con Google
            </button>

            {/* Olvidaste tu contraseña */}
            <div className="mt-5 text-xs text-left">
                <Link to="/forgot/id" className="underline text-gray-700 hover:text-gray-900 dark:hover:text-white">
                    ¿Olvidaste tu contraseña?
                </Link>
            </div>

            {/* Enlaces inferiores */}
            <div className="mt-3 flex justify-between text-sm">
                <Link to="/" className="underline text-gray-700 hover:text-gray-900 dark:hover:text-white">
                    Regresar
                </Link>
                <Link to="/register" className="py-2 px-5 bg-[#f59e0b] text-white rounded-xl hover:bg-[#bb4d00] transition">
                    Registrarse
                </Link>
            </div>
        </div>

        

    </div>
);

};

export default Login;

