import { useState } from "react"
import { useNavigate, Link } from "react-router"
import { useForm } from "react-hook-form"
import { ToastContainer, toast } from "react-toastify"
import storeAuth from "../context/storeAuth"
import storeProfile from "../context/storeProfile"
import { loginAdmin } from "../services/adminService"

const AdminLogin = () => {
  const navigate = useNavigate()
  const { setToken, setRol } = storeAuth()
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [loading, setLoading] = useState(false)

  const onSubmit = async (form) => {
    setLoading(true)
    try {
      const data = await loginAdmin(form)

      // Primero el rol y después el token, para que el rol ya esté guardado
      // cuando App.jsx dispare profile() al detectar el token
      setRol(data.rol)
      setToken(data.token)

      // El backend no tiene /perfil para el admin, así que se arma con la respuesta del login
      storeProfile.setState({
        user: { _id: data._id, nombre: data.nombre, email: data.email, rol: data.rol },
      })

      toast.success("Bienvenido, administrador")
      navigate("/dashboard/admin", { replace: true })
    } catch (error) {
      toast.error(error.response?.data?.msg || "No se pudo iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex justify-center items-center">
      <ToastContainer />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-11/12 sm:w-96 bg-white dark:bg-[#1e2939] p-8 rounded-xl shadow-xl space-y-4"
      >
        <h1 className="text-2xl font-semibold text-center">Acceso administrador</h1>

        <div>
          <label className="block text-sm font-semibold mb-1">Correo electrónico</label>
          <input
            type="email"
            className="w-full rounded-md border border-gray-300 px-2 py-1"
            {...register("email", { required: "El correo es obligatorio" })}
          />
          {errors.email && <p className="text-red-800">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Contraseña</label>
          <input
            type="password"
            className="w-full rounded-md border border-gray-300 px-2 py-1"
            {...register("password", { required: "La contraseña es obligatoria" })}
          />
          {errors.password && <p className="text-red-800">{errors.password.message}</p>}
        </div>

        <button
          disabled={loading}
          className="w-full py-2 bg-[#f59e0b] text-white rounded-xl hover:bg-[#bb4d00] transition disabled:opacity-60"
        >
          {loading ? "Ingresando..." : "Iniciar sesión"}
        </button>

        <Link to="/login" className="block text-center text-sm underline">
          Volver al login normal
        </Link>
      </form>
    </div>
  )
}

export default AdminLogin