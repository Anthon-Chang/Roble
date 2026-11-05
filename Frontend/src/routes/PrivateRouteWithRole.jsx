import storeAuth from "../context/storeAuth";
import { Forbidden } from "../pages/Forbidden";

export default function PrivateRouteWithRole({ children }) {
  const { rol } = storeAuth();

  // ⛔ Bloquea SOLO a clientes
  if (rol === "cliente") {
    return <Forbidden />;
  }

  // ✅ Otros roles sí pasan
  return children;
}
