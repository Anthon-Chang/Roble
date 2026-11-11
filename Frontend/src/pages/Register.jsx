import { useState } from "react"
import { MdVisibility, MdVisibilityOff } from "react-icons/md"
import { Link } from "react-router"
import { useForm } from "react-hook-form"
import { ToastContainer } from "react-toastify"
import { useFetch } from "../hooks/useFetch"
import logo_forget from "../../public/images/login.webp"

const inputCls =
    "block w-full rounded-md border border-gray-300 py-1 px-1.5 text-gray-500"

export const Register = () => {
    const [showPassword, setShowPassword] = useState(false)
    const [tipo, setTipo] = useState(null) // null | "carpintero" | "cliente"
    const [showAviso, setShowAviso] = useState(false)

    const fetchDataBackend = useFetch()
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        shouldUnregister: true,
    })

    const elegirTipo = (nuevoTipo) => {
        if (nuevoTipo === tipo) return
        reset()
        setTipo(nuevoTipo)
        setShowAviso(nuevoTipo === "carpintero")
    }

    const registerUser = async (dataForm) => {
        const url =
            tipo === "carpintero"
                ? `${import.meta.env.VITE_BACKEND_URL}/api/carpintero/registro`
                : `${import.meta.env.VITE_BACKEND_URL}/api/cliente/registro`
        try {
            await fetchDataBackend(url, dataForm, "POST")
            reset()
        } catch {
            // useFetch ya muestra el toast con el error
        }
    }

    const btnTipo = (valor) =>
        `flex-1 py-2 rounded-xl border font-semibold transition ${
            tipo === valor
                ? "bg-[#f59e0b] text-white border-[#f59e0b]"
                : "bg-white text-gray-700 border-gray-300 hover:border-[#f59e0b]"
        }`

    return (
        <div className="flex flex-col sm:flex-row min-h-screen">
            <ToastContainer />

            {/* Modal de advertencia para carpinteros */}
            {showAviso && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                    <div className="bg-white dark:bg-[#1e2939] rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
                        <h2 className="text-xl font-bold text-amber-700">⚠️ Aviso importante</h2>
                        <p className="text-sm">
                            Tu perfil como carpintero será <b>supervisado por el administrador</b>.
                            Después de registrarte y subir tu CV, el administrador lo revisará y
                            tu perfil será <b>aprobado o rechazado</b>.
                        </p>
                        <p className="text-sm">
                            Hasta que sea aprobado no podrás publicar mobiliario, modelos 3D ni
                            registrar proyectos. Te avisaremos por correo del resultado.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => { setShowAviso(false); setTipo(null) }}
                                className="px-4 py-2 rounded-xl border border-gray-300 text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowAviso(false)}
                                className="px-4 py-2 rounded-xl bg-[#f59e0b] text-white text-sm hover:bg-[#bb4d00]"
                            >
                                Entendido, continuar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full sm:w-1/2 min-h-screen bg-white dark:bg-[#1e2939] flex justify-center items-center py-10">
                <div className="md:w-4/5 sm:w-full px-4">
                    <h1 className="text-3xl font-semibold mb-2 text-center">Bienvenido(a)</h1>
                    <small className="text-gray-400 block my-4 text-sm text-center">
                        ¿Cómo quieres registrarte?
                    </small>

                    {/* Botones de tipo de cuenta */}
                    <div className="flex gap-3 mb-5">
                        <button type="button" className={btnTipo("carpintero")} onClick={() => elegirTipo("carpintero")}>
                            Soy carpintero
                        </button>
                        <button type="button" className={btnTipo("cliente")} onClick={() => elegirTipo("cliente")}>
                            Soy cliente
                        </button>
                    </div>

                    {tipo === "carpintero" && !showAviso && (
                        <p className="mb-4 text-xs rounded-md bg-amber-50 text-amber-800 border border-amber-300 p-2">
                            Tu perfil será supervisado por el administrador y podrá ser aprobado o rechazado.
                        </p>
                    )}

                    {tipo && (
                        <form onSubmit={handleSubmit(registerUser)}>
                            <div className="mb-3">
                                <label className="mb-2 block text-sm font-semibold">Nombre</label>
                                <input type="text" placeholder="Ingresa tu nombre" className={inputCls}
                                    {...register("nombre", { required: "El nombre es obligatorio" })} />
                                {errors.nombre && <p className="text-red-800">{errors.nombre.message}</p>}
                            </div>

                            <div className="mb-3">
                                <label className="mb-2 block text-sm font-semibold">Apellido</label>
                                <input type="text" placeholder="Ingresa tu apellido" className={inputCls}
                                    {...register("apellido", { required: "El apellido es obligatorio" })} />
                                {errors.apellido && <p className="text-red-800">{errors.apellido.message}</p>}
                            </div>

                            {tipo === "carpintero" && (
                                <>
                                    <div className="mb-3">
                                        <label className="mb-2 block text-sm font-semibold">Dirección</label>
                                        <input type="text" placeholder="Ingresa tu dirección" className={inputCls}
                                            {...register("direccion", { required: "La dirección es obligatoria" })} />
                                        {errors.direccion && <p className="text-red-800">{errors.direccion.message}</p>}
                                    </div>

                                    <div className="mb-3">
                                        <label className="mb-2 block text-sm font-semibold">Años de experiencia</label>
                                        <input type="number" min="0" placeholder="0" className={inputCls}
                                            {...register("anios_experiencia", {
                                                required: "Los años de experiencia son obligatorios",
                                                min: { value: 0, message: "No puede ser negativo" },
                                            })} />
                                        {errors.anios_experiencia && <p className="text-red-800">{errors.anios_experiencia.message}</p>}
                                    </div>
                                </>
                            )}

                            {tipo === "cliente" && (
                                <div className="mb-3">
                                    <label className="mb-2 block text-sm font-semibold">Cédula</label>
                                    <input type="text" inputMode="numeric" placeholder="10 dígitos" className={inputCls}
                                        {...register("cedula", {
                                            pattern: { value: /^\d{10}$/, message: "La cédula debe tener 10 dígitos" },
                                        })} />
                                    {errors.cedula && <p className="text-red-800">{errors.cedula.message}</p>}
                                </div>
                            )}

                            <div className="mb-3">
                                <label className="mb-2 block text-sm font-semibold">Celular</label>
                                <input type="text" inputMode="tel" placeholder="Ingresa tu celular" className={inputCls}
                                    {...register("celular", { required: "El celular es obligatorio" })} />
                                {errors.celular && <p className="text-red-800">{errors.celular.message}</p>}
                            </div>

                            <div className="mb-3">
                                <label className="mb-2 block text-sm font-semibold">Correo electrónico</label>
                                <input type="email" placeholder="Ingresa tu correo electrónico" className={inputCls}
                                    {...register("email", { required: "El correo electrónico es obligatorio" })} />
                                {errors.email && <p className="text-red-800">{errors.email.message}</p>}
                            </div>

                            <div className="mb-3">
                                <label className="block text-sm font-semibold mb-1">Contraseña</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Mínimo 8 caracteres"
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10"
                                        {...register("password", {
                                            required: "La contraseña es obligatoria",
                                            minLength: { value: 8, message: "Mínimo 8 caracteres" },
                                        })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-white"
                                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    >
                                        {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-800">{errors.password.message}</p>}
                            </div>

                            <div className="mb-3">
                                <button className="bg-[#f59e0b] text-white border py-2 w-full rounded-xl mt-5 hover:scale-105 duration-300 hover:bg-[#bb4d00]">
                                    Registrarse como {tipo}
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="mt-3 text-sm flex justify-between items-center">
                        <p>¿Ya posees una cuenta?</p>
                        <Link to="/login" className="py-2 px-5 bg-[#f59e0b] text-white border rounded-xl hover:scale-110 duration-300 hover:bg-[#bb4d00]">
                            Iniciar sesión
                        </Link>
                    </div>
                </div>
            </div>

            <div className="hidden sm:block sm:w-1/2">
                <img src={logo_forget} alt="logo_login" className="w-full h-full object-cover" />
            </div>
        </div>
    )
}