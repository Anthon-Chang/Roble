import axios from "axios"
import storeAuth from "../context/storeAuth"

const API = import.meta.env.VITE_BACKEND_URL

const auth = () => ({ headers: { Authorization: `Bearer ${storeAuth.getState().token}` } })

export async function loginAdmin({ email, password }) {
  const { data } = await axios.post(`${API}/api/admin/login`, { email, password })
  return data // { token, rol, nombre, _id, email }
}

export async function listarUsuarios() {
  const { data } = await axios.get(`${API}/api/admin/usuarios`, auth())
  return data
}

export async function detalleCarpintero(id) {
  const { data } = await axios.get(`${API}/api/admin/usuarios/carpintero/${id}`, auth())
  return data
}

export async function aprobarCarpintero(id) {
  const { data } = await axios.put(`${API}/api/admin/carpinteros/${id}/aprobar`, {}, auth())
  return data // { msg, carpintero }
}

export async function rechazarCarpintero(id, motivo) {
  const { data } = await axios.put(`${API}/api/admin/carpinteros/${id}/rechazar`, { motivo }, auth())
  return data // { msg, carpintero }
}