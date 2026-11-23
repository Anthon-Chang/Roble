import { Link, NavLink, Outlet, useNavigate } from "react-router-dom"
import { useEffect, useRef, useState } from "react"
import FP from "../assets/fotoPerfil.jpeg"
import storeAuth from "../context/storeAuth"
import storeProfile from "../context/storeProfile"
import storeChat from "../context/storeChat"
import { cerrarSesion } from "../services/sesionService"
import { closeSocket } from "../services/socket"

const Dashboard = () => {
  const navigate = useNavigate()
  const { clearToken, rol } = storeAuth()
  const { user } = storeProfile()
  const cargarResumen = storeChat((s) => s.cargarResumen)
  const totalNoLeidos = storeChat((s) => s.totalNoLeidos(user?._id))
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // El resumen de chats (para el badge de "Mensajes") se refresca al entrar y cada 30s.
  useEffect(() => {
    if (rol !== "carpintero" && rol !== "cliente") return
    cargarResumen()
    const intervalo = setInterval(cargarResumen, 30000)
    return () => clearInterval(intervalo)
  }, [rol])

  const nombre = user?.nombre || user?.nombreCliente || (rol === "administrador" ? "Administrador" : "Usuario")
  const links = rol === "administrador"
    ? [
        { to: "/dashboard/admin", label: "Panel principal", icon: "▦" },
        { to: "/dashboard/admin/quejas", label: "Quejas y sugerencias", icon: "⚑" },
        { to: "/dashboard/admin/sanciones", label: "Sanciones", icon: "⚠" },
      ]
    : rol === "carpintero"
      ? [
          { to: "/dashboard/estado-perfil", label: "Estado del perfil", icon: "◉" },
          { to: "/dashboard/cv", label: "Mi currículum (CV)", icon: "▤" },
          { to: "/dashboard/modelos3d", label: "Mis modelos 3D", icon: "◇" },
          { to: "/dashboard/list", label: "Proyectos solicitados", icon: "▣" },
          { to: "/dashboard/mis-sanciones", label: "Mis sanciones", icon: "⚠" },
          { to: "/dashboard/mensajes", label: "Mensajes", icon: "✉︎", badge: totalNoLeidos },
        ]
      : [
          { to: "/dashboard", label: "Resumen", icon: "▦" },
          { to: "/dashboard/explorar", label: "Explorar carpinteros", icon: "♧" },
          { to: "/dashboard/catalogo", label: "Catálogo y diseños 3D", icon: "◇" },
          { to: "/dashboard/solicitar", label: "Solicitar proyecto", icon: "+" },
          { to: "/dashboard/mis-proyectos", label: "Mis proyectos", icon: "▤" },
          { to: "/dashboard/quejas", label: "Quejas y sugerencias", icon: "⚑" },
          { to: "/dashboard/mensajes", label: "Mensajes", icon: "✉︎", badge: totalNoLeidos },
        ]

  const salir = async () => {
    await cerrarSesion()
    closeSocket()
    clearToken()
    storeProfile.getState().clearUser?.()
    navigate("/login", { replace: true })
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col">
      <header className="bg-[#461901] text-white flex items-center justify-between px-5 py-3 shadow-md">
        <Link to={rol === "administrador" ? "/dashboard/admin" : "/dashboard"} className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo Roble" className="w-14 h-14 object-contain" />
          <span className="text-xl font-bold">Roble</span>
        </Link>
        <div className="relative" ref={menuRef}>
          <button type="button" onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/10">
            <span className="text-sm text-right">
              <strong className="block">{nombre} {user?.apellido || ""}</strong>
              <span className="capitalize text-xs text-amber-200">{rol || user?.rol}</span>
            </span>
            <img src={FP} alt="Perfil" className="w-10 h-10 rounded-full border-2 border-amber-300 object-cover" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 z-30 w-56 rounded-lg bg-white text-gray-800 shadow-xl border">
              <Link to="/dashboard/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-3 hover:bg-gray-100">Mi perfil</Link>
              <button onClick={salir} className="w-full text-left px-4 py-3 text-red-700 hover:bg-red-50">Cerrar sesión</button>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="hidden md:block w-64 shrink-0 bg-white border-r border-gray-200 p-4">
          <p className="px-3 mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
            {rol === "administrador" ? "Administración" : rol === "carpintero" ? "Mi espacio de carpintero" : "Mi espacio de cliente"}
          </p>
          <nav className="space-y-1">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.to === "/dashboard"} className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${isActive ? "bg-amber-100 text-amber-900" : "text-gray-600 hover:bg-gray-100"}`
              }>
                <span className="text-lg">{link.icon}</span>
                <span className="flex-1">{link.label}</span>
                {!!link.badge && (
                  <span className="min-w-[1.25rem] text-center rounded-full bg-red-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
                    {link.badge > 9 ? "9+" : link.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
          {rol === "carpintero" && (
            <div className="mt-6 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
              Mantén tu CV actualizado y revisa el estado de aprobación de tu perfil.
            </div>
          )}
          {rol === "cliente" && (
            <div className="mt-6 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
              Encuentra profesionales aprobados, explora diseños y consulta el avance de tus pedidos desde aquí.
            </div>
          )}
        </aside>

        <main className="flex-1 min-w-0 overflow-y-auto p-4 md:p-8">
          <div className="md:hidden flex gap-2 overflow-x-auto pb-4">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.to === "/dashboard"} className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold flex items-center gap-1.5 ${isActive ? "bg-amber-700 text-white" : "bg-white text-gray-700 border"}`
              }>
                {link.label}
                {!!link.badge && (
                  <span className="min-w-[1.1rem] text-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {link.badge > 9 ? "9+" : link.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Dashboard
