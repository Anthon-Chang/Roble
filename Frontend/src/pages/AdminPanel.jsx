import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { ToastContainer, toast } from "react-toastify"
import storeAuth from "../context/storeAuth"
import { listarUsuarios } from "../services/adminService"

export const BADGE = {
  pendiente: "bg-yellow-100 text-yellow-800",
  aprobado: "bg-green-100 text-green-800",
  rechazado: "bg-red-100 text-red-800",
}

const AdminPanel = () => {
  const navigate = useNavigate()
  const clearToken = storeAuth((s) => s.clearToken)
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [rol, setRol] = useState("")
  const [estado, setEstado] = useState("")

  useEffect(() => {
    const cargar = async () => {
      try {
        setUsuarios(await listarUsuarios())
      } catch (error) {
        if (error.response?.status === 401) return clearToken()
        toast.error(error.response?.data?.msg || "No se pudo cargar la lista")
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  // El estado de aprobación solo aplica a carpinteros
  const cambiarRol = (valor) => {
    setRol(valor)
    if (valor === "cliente") setEstado("")
  }
  const cambiarEstado = (valor) => {
    setEstado(valor)
    if (valor) setRol("carpintero")
  }

  const filtrados = useMemo(
    () =>
      usuarios.filter(
        (u) => (!rol || u.rol === rol) && (!estado || u.estadoAprobacion === estado)
      ),
    [usuarios, rol, estado]
  )

  const carpinteros = usuarios.filter((u) => u.rol === "carpintero")
  const metricas = [
    { t: "Carpinteros", v: carpinteros.length },
    { t: "Clientes", v: usuarios.length - carpinteros.length },
    { t: "Pendientes", v: carpinteros.filter((c) => c.estadoAprobacion === "pendiente").length },
    { t: "Aprobados", v: carpinteros.filter((c) => c.estadoAprobacion === "aprobado").length },
    { t: "Rechazados", v: carpinteros.filter((c) => c.estadoAprobacion === "rechazado").length },
  ]

  const selectCls = "rounded-md border border-gray-300 px-3 py-2 text-gray-700 bg-white"

  return (
    <div>
      <ToastContainer />
      <h1 className="font-black text-4xl text-gray-500">Panel del administrador</h1>
      <hr className="my-4 border-t-2 border-gray-300" />

      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {metricas.map((m) => (
          <div key={m.t} className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">{m.t}</p>
            <p className="text-3xl font-semibold text-gray-800">{m.v}</p>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <label className="text-sm font-semibold">
          Rol
          <select className={`${selectCls} block mt-1`} value={rol} onChange={(e) => cambiarRol(e.target.value)}>
            <option value="">Todos</option>
            <option value="carpintero">Carpinteros</option>
            <option value="cliente">Clientes</option>
          </select>
        </label>
        <label className="text-sm font-semibold">
          Estado de aprobación
          <select
            className={`${selectCls} block mt-1 disabled:opacity-50`}
            value={estado}
            disabled={rol === "cliente"}
            onChange={(e) => cambiarEstado(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="aprobado">Aprobado</option>
            <option value="rechazado">Rechazado</option>
          </select>
        </label>
        {(rol || estado) && (
          <button className="text-sm underline" onClick={() => { setRol(""); setEstado("") }}>
            Limpiar filtros
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando usuarios...</p>
      ) : filtrados.length === 0 ? (
        <div className="p-4 text-sm text-red-800 rounded-lg bg-red-50">No hay usuarios con esos filtros</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto shadow-lg bg-white">
            <thead className="bg-gray-800 text-slate-400">
              <tr>
                {["N°", "Nombre", "Rol", "Correo", "Celular", "Estado", "CV", "Registro", "Acciones"].map((h) => (
                  <th key={h} className="p-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((u, i) => (
                <tr key={`${u.rol}-${u._id}`} className="hover:bg-gray-300 text-center text-gray-800">
                  <td>{i + 1}</td>
                  <td className="px-2 py-1 text-left">{u.nombre} {u.apellido}</td>
                  <td className="capitalize">{u.rol}</td>
                  <td className="px-2">{u.email}</td>
                  <td>{u.celular || "-"}</td>
                  <td>
                    {u.rol === "carpintero" ? (
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded capitalize ${BADGE[u.estadoAprobacion]}`}>
                        {u.estadoAprobacion}
                      </span>
                    ) : "-"}
                  </td>
                  <td>{u.rol === "carpintero" ? (u.cvUrl ? "Sí" : "No") : "-"}</td>
                  <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString("es-EC") : "-"}</td>
                  <td className="py-2">
                    {u.rol === "carpintero" ? (
                      <button
                        className="px-3 py-1 text-sm bg-amber-700 text-white rounded-lg hover:bg-amber-800"
                        onClick={() => navigate(`/dashboard/admin/carpintero/${u._id}`)}
                      >
                        Ver detalle
                      </button>
                    ) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AdminPanel