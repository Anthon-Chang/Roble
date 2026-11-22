import axios from "axios"
import storeAuth from "../context/storeAuth"

const API = import.meta.env.VITE_BACKEND_URL

// No se fija Content-Type: axios lo arma solo (con el boundary) cuando se envía FormData
const auth = () => ({ headers: { Authorization: `Bearer ${storeAuth.getState().token}` } })

export const mensajeError = (error, porDefecto) =>
  error.response?.data?.msg || error.response?.data?.message || porDefecto

// ---------- HU-011: enviar / listar propuestas ----------

// Carpintero aprobado y dueño del proyecto. multipart: proyecto, description (opcional)
// y el archivo 3D en el campo "modelo" (.obj, .glb, .gltf)
export const enviarPropuesta = async ({ proyectoId, description, archivo }, onProgress) => {
  const form = new FormData()
  form.append("proyecto", proyectoId)
  if (description) form.append("description", description)
  form.append("modelo", archivo)

  const { data } = await axios.post(`${API}/api/propuesta/registro`, form, {
    ...auth(),
    onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded * 100) / e.total)),
  })
  return data // { msg, propuesta }
}

// Carpintero dueño, cliente dueño o administrador
export const listarPropuestasProyecto = async (proyectoId) =>
  (await axios.get(`${API}/api/propuesta/proyecto/${proyectoId}`, auth())).data

// ---------- HU-012: aprobar / rechazar (solo cliente dueño del proyecto) ----------

export const aprobarPropuesta = async (id) =>
  (await axios.put(`${API}/api/propuesta/aprobar/${id}`, {}, auth())).data // { msg, propuesta }

export const rechazarPropuesta = async (id, motivo) =>
  (await axios.put(`${API}/api/propuesta/rechazar/${id}`, { motivo }, auth())).data // { msg, propuesta }