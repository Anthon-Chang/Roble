import axios from "axios"
import storeAuth from "../context/storeAuth"

const API = import.meta.env.VITE_BACKEND_URL

// Cierre de sesión (HU-018): invalida las sesiones del usuario en el backend.
// Si la llamada falla (token ya vencido, sin red, etc.) no bloquea el cierre de sesión local.
export const cerrarSesion = async () => {
  try {
    await axios.post(
      `${API}/api/auth/logout`,
      {},
      { headers: { Authorization: `Bearer ${storeAuth.getState().token}` } }
    )
  } catch (error) {
    console.error(error)
  }
}
