import axios from "axios"
import storeAuth from "../context/storeAuth"

const API = import.meta.env.VITE_BACKEND_URL

// No se fija Content-Type: axios lo arma solo (con el boundary) cuando se envía FormData
const auth = () => ({ headers: { Authorization: `Bearer ${storeAuth.getState().token}` } })

export const mensajeError = (error, porDefecto) => error.response?.data?.msg || error.response?.data?.message || porDefecto

// ---------- Perfil y CV ----------
export const obtenerPerfil = async () => (await axios.get(`${API}/api/carpintero/perfil`, auth())).data

export const obtenerMiCV = async () => (await axios.get(`${API}/api/carpintero/cv`, auth())).data

// Si ya existe un CV se usa PUT (actualizar); si no, POST (subir)
export const guardarCV = async (archivo, existe, onProgress) => {
  const form = new FormData()
  form.append("cv", archivo)
  const { data } = await axios.request({
    method: existe ? "put" : "post",
    url: `${API}/api/carpintero/cv`,
    data: form,
    ...auth(),
    onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded * 100) / e.total)),
  })
  return data
}

// ---------- Modelos 3D ----------
export const listarMisModelos = async () => (await axios.get(`${API}/api/models/mis-modelos`, auth())).data.data

export const crearModelo = async (form, onProgress) =>
  (await axios.post(`${API}/api/models`, form, {
    ...auth(),
    onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded * 100) / e.total)),
  })).data.data

export const actualizarModelo = async (id, form, onProgress) =>
  (await axios.put(`${API}/api/models/${id}`, form, {
    ...auth(),
    onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded * 100) / e.total)),
  })).data.data

export const eliminarModelo = async (id) => (await axios.delete(`${API}/api/models/${id}`, auth())).data