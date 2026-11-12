import { useEffect, useState } from "react"
import { Link } from "react-router"
import { toast, ToastContainer } from "react-toastify"
import storeAuth from "../context/storeAuth"
import storeProfile from "../context/storeProfile"
import { listarCarpinteros, listarModelos, listarMisProyectos, mensajeError } from "../services/clienteService"

const accesos = [
  { to: "/dashboard/explorar", title: "Encuentra tu carpintero", desc: "Conoce profesionales aprobados y revisa su experiencia.", icon: "♧" },
  { to: "/dashboard/catalogo", title: "Explora el catálogo", desc: "Inspírate con mobiliario y modelos tridimensionales.", icon: "◇" },
  { to: "/dashboard/solicitar", title: "Crea tu proyecto", desc: "Cuéntanos qué mueble necesitas y elige un profesional.", icon: "+" },
  { to: "/dashboard/mis-proyectos", title: "Sigue tus proyectos", desc: "Consulta etapas, avances y pagos de tus solicitudes.", icon: "▤" },
]

export default function ClienteInicio() {
  const user = storeProfile((s) => s.user)
  const clearToken = storeAuth((s) => s.clearToken)
  const [stats, setStats] = useState({ carpinteros: 0, modelos: 0, proyectos: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let activo = true
    Promise.all([listarCarpinteros(), listarModelos(), listarMisProyectos()])
      .then(([carpinteros, modelos, proyectos]) => {
        if (activo) setStats({ carpinteros: carpinteros.length, modelos: modelos.length, proyectos: proyectos.length })
      })
      .catch((e) => {
        if (e.response?.status === 401) clearToken()
        else toast.error(mensajeError(e, "No se pudo cargar el resumen"))
      })
      .finally(() => activo && setLoading(false))
    return () => { activo = false }
  }, [clearToken])

  return <div className="space-y-7">
    <ToastContainer />
    <section className="rounded-2xl bg-gradient-to-r from-[#461901] to-[#8a4b20] p-7 md:p-9 text-white shadow-lg">
      <p className="text-amber-200 text-sm font-semibold tracking-widest uppercase">Espacio del cliente</p>
      <h1 className="mt-2 text-3xl md:text-4xl font-black">¡Hola{user?.nombre ? `, ${user.nombre}` : ""}!</h1>
      <p className="mt-3 max-w-2xl text-amber-50">Diseña tus espacios con profesionales de la madera. Explora ideas, encuentra a tu carpintero ideal y gestiona tus proyectos en un solo lugar.</p>
      <Link to="/dashboard/explorar" className="inline-flex mt-6 rounded-lg bg-amber-400 px-5 py-3 font-bold text-amber-950 hover:bg-amber-300">Explorar carpinteros <span className="ml-2">→</span></Link>
    </section>

    <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[{ label: "Carpinteros aprobados", value: stats.carpinteros, icon: "♧" }, { label: "Diseños 3D disponibles", value: stats.modelos, icon: "◇" }, { label: "Mis proyectos", value: stats.proyectos, icon: "▤" }].map((x) =>
        <div key={x.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><span className="text-sm text-gray-500">{x.label}</span><span className="text-2xl text-amber-700">{x.icon}</span></div>
          <p className="mt-2 text-3xl font-black text-gray-900">{loading ? "—" : x.value}</p>
        </div>
      )}
    </section>

    <section>
      <div className="mb-4"><h2 className="text-2xl font-bold text-gray-800">¿Qué deseas hacer hoy?</h2><p className="text-sm text-gray-500 mt-1">Accede rápidamente a las herramientas de tu cuenta.</p></div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {accesos.map((a) => <Link key={a.to} to={a.to} className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-amber-400 hover:shadow-md">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-100 text-2xl text-amber-800">{a.icon}</span>
          <h3 className="mt-4 font-bold text-gray-900 group-hover:text-amber-800">{a.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">{a.desc}</p>
          <span className="mt-4 inline-block text-sm font-semibold text-amber-800">Ir ahora →</span>
        </Link>)}
      </div>
    </section>
  </div>
}
