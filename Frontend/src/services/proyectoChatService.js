import axios from "axios"
import storeAuth from "../context/storeAuth"

const API = import.meta.env.VITE_BACKEND_URL
const auth = () => ({ headers: { Authorization: `Bearer ${storeAuth.getState().token}` } })

// Mismo endpoint que ya usan Table.jsx y clienteService.listarMisProyectos: el backend
// ya filtra por rol (carpintero: los suyos; cliente: los suyos) a partir del JWT.
// Se centraliza aquí para que Dashboard.jsx y Mensajes.jsx no dupliquen el fetch.
export const listarProyectosPropios = async () => {
  try {
    const { data } = await axios.get(`${API}/api/proyecto/listar`, auth())
    return Array.isArray(data) ? data : []
  } catch (error) {
    if (error.response?.status === 404) return [] // el backend responde 404 cuando no hay proyectos
    throw error
  }
}
