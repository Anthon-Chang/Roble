import axios from "axios"
import storeAuth from "../context/storeAuth"

const API = import.meta.env.VITE_BACKEND_URL
const auth = () => ({ headers: { Authorization: `Bearer ${storeAuth.getState().token}` } })

export const mensajeError = (e, porDefecto) =>
  e.response?.data?.msg || e.response?.data?.message || porDefecto

// Login unificado: primero carpintero; si no existe (404) prueba con la ruta del cliente
export const loginUnificado = async ({ email, password }) => {
  try {
    const { data } = await axios.post(`${API}/api/carpintero/login`, { email, password })
    return data
  } catch (e) {
    if (e.response?.status !== 404) throw e
  }
  const { data } = await axios.post(`${API}/api/cliente/login`, { email, password })
  return data // { token, rol: "cliente", _id, nombre, apellido, email }
}

export const listarCarpinteros = async () => (await axios.get(`${API}/api/carpintero/aprobados`, auth())).data
export const detalleCarpintero = async (id) => (await axios.get(`${API}/api/carpintero/aprobados/${id}`, auth())).data

export const listarModelos = async () => (await axios.get(`${API}/api/models`, auth())).data.data
export const detalleModelo = async (id) => (await axios.get(`${API}/api/models/${id}`, auth())).data.data

export const listarMuebles = async () => (await axios.get(`${API}/api/mueble`, auth())).data

export const solicitarProyecto = async (form) =>
  (await axios.post(`${API}/api/proyecto/solicitar`, form, auth())).data

export const listarMisProyectos = async () => {
  try {
    return (await axios.get(`${API}/api/proyecto/listar`, auth())).data
  } catch (e) {
    if (e.response?.status === 404) return [] // el backend responde 404 cuando no hay proyectos
    throw e
  }
}
export const detalleProyecto = async (id) => (await axios.get(`${API}/api/proyecto/detalle/${id}`, auth())).data

// Descarga: si el bucket bloquea el fetch por CORS, abre el archivo en otra pestaña
export const descargarArchivo = async (url, nombre) => {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error()
    const href = URL.createObjectURL(await res.blob())
    const a = document.createElement("a")
    a.href = href
    a.download = nombre
    a.click()
    URL.revokeObjectURL(href)
  } catch {
    window.open(url, "_blank", "noopener,noreferrer")
  }
}