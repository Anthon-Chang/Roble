import { NavLink } from "react-router"

const links = [
  { to: "/dashboard/explorar", label: "Carpinteros" },
  { to: "/dashboard/catalogo", label: "Catálogo" },
  { to: "/dashboard/solicitar", label: "Solicitar proyecto" },
  { to: "/dashboard/mis-proyectos", label: "Mis proyectos" },
]

const ClienteNav = () => (
  <nav className="flex flex-wrap gap-2 mb-6">
    {links.map((l) => (
      <NavLink
        key={l.to}
        to={l.to}
        className={({ isActive }) =>
          `px-4 py-2 rounded-lg text-sm font-semibold border ${
            isActive ? "bg-amber-700 text-white border-amber-700" : "bg-white text-gray-700 border-gray-300 hover:border-amber-700"
          }`
        }
      >
        {l.label}
      </NavLink>
    ))}
  </nav>
)

export default ClienteNav