import axios from "axios"

const API = import.meta.env.VITE_BACKEND_URL

export async function loginAdmin({ email, password }) {
  const { data } = await axios.post(`${API}/api/admin/login`, { email, password })
  return data // { token, rol, nombre, _id, email }
}