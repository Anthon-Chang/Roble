import axios from "axios"
import storeAuth from "../context/storeAuth"

const API = import.meta.env.VITE_BACKEND_URL

// No se fija Content-Type: axios lo arma solo (con el boundary) cuando se envía FormData
const auth = () => ({ headers: { Authorization: `Bearer ${storeAuth.getState().token}` } })

export const mensajeError = (e, porDefecto) => e.response?.data?.msg || e.response?.data?.message || porDefecto

// ---------- Carpintero ----------
export const misSanciones = async () => (await axios.get(`${API}/api/sancion/mias`, auth())).data

// ---------- Administrador (HU-017) ----------
// form: FormData con carpintero, motivo, nivel, diasSuspension (si nivel="suspension_temporal"),
// quejaRelacionada (opcional) y evidencia (archivo opcional)
export const crearSancion = async (form, onProgress) =>
  (await axios.post(`${API}/api/sancion`, form, {
    ...auth(),
    onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded * 100) / e.total)),
  })).data

export const listarSanciones = async (carpinteroId) => {
  const params = carpinteroId ? { carpintero: carpinteroId } : {}
  return (await axios.get(`${API}/api/sancion`, { ...auth(), params })).data
}

export const detalleSancion = async (id) => (await axios.get(`${API}/api/sancion/${id}`, auth())).data

// cambios: { motivo?, activa? }
export const actualizarSancion = async (id, cambios) =>
  (await axios.put(`${API}/api/sancion/${id}`, cambios, auth())).data
