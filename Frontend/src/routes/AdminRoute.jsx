import storeAuth from "../context/storeAuth"
import { Forbidden } from "../pages/Forbidden"

const AdminRoute = ({ children }) => {
  const rol = storeAuth((s) => s.rol)
  return rol === "administrador" ? children : <Forbidden />
}

export default AdminRoute