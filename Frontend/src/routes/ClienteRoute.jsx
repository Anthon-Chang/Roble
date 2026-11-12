import storeAuth from "../context/storeAuth"
import { Forbidden } from "../pages/Forbidden"

const ClienteRoute = ({ children }) => {
  const rol = storeAuth((s) => s.rol)
  return rol === "cliente" ? children : <Forbidden />
}

export default ClienteRoute