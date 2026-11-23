import axios from "axios"
import storeAuth from "../context/storeAuth"

const API = import.meta.env.VITE_BACKEND_URL
const auth = () => ({ headers: { Authorization: `Bearer ${storeAuth.getState().token}` } })

export const mensajeError = (e, porDefecto) => e.response?.data?.msg || e.response?.data?.message || porDefecto

// Resumen de chats (último mensaje por proyecto) para la sección "Mensajes" y su badge
export const resumenChats = async () => (await axios.get(`${API}/api/mensaje/resumen`, auth())).data

// Historial completo de un proyecto, para la carga inicial del chat
export const historialMensajes = async (proyectoId) =>
  (await axios.get(`${API}/api/mensaje/${proyectoId}`, auth())).data
