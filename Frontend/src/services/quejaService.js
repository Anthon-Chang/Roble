import axios from "axios"
import storeAuth from "../context/storeAuth"

const API = import.meta.env.VITE_BACKEND_URL

// No se fija Content-Type: axios lo arma solo (con el boundary) cuando se envía FormData
const auth = () => ({ headers: { Authorization: `Bearer ${storeAuth.getState().token}` } })

export const mensajeError = (e, porDefecto) => e.response?.data?.msg || e.response?.data?.message || porDefecto

// ---------- Cliente (HU-016) ----------
// form: FormData con tipo, motivo, carpintero (si tipo="queja") y evidencia (archivo opcional)
export const crearQueja = async (form, onProgress) =>
  (await axios.post(`${API}/api/queja`, form, {
    ...auth(),
    onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded * 100) / e.total)),
  })).data

// ---------- Administrador (HU-016) ----------
export const listarQuejas = async ({ tipo, estado } = {}) => {
  const params = {}
  if (tipo) params.tipo = tipo
  if (estado) params.estado = estado
  return (await axios.get(`${API}/api/queja`, { ...auth(), params })).data
}

export const detalleQueja = async (id) => (await axios.get(`${API}/api/queja/${id}`, auth())).data

export const seguimientoQueja = async (id, estado) =>
  (await axios.put(`${API}/api/queja/${id}/seguimiento`, { estado }, auth())).data

export const eliminarQueja = async (id) => (await axios.delete(`${API}/api/queja/${id}`, auth())).data
