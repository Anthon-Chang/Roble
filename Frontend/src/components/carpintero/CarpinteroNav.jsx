import { NavLink } from "react-router"

export const BADGE = {
  pendiente: "bg-yellow-100 text-yellow-800",
  aprobado: "bg-green-100 text-green-800",
  rechazado: "bg-red-100 text-red-800",
}

const links = [
  { to: "/dashboard/estado-perfil", label: "Estado del perfil" },
  { to: "/dashboard/cv", label: "Mi CV" },
  { to: "/dashboard/modelos3d", label: "Modelos 3D" },
]

const CarpinteroNav = () => (
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

export default CarpinteroNav