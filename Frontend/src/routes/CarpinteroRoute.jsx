import storeAuth from "../context/storeAuth"
import { Forbidden } from "../pages/Forbidden"

const CarpinteroRoute = ({ children }) => {
  const rol = storeAuth((s) => s.rol)
  return rol === "carpintero" ? children : <Forbidden />
}

export default CarpinteroRoute