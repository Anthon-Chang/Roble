import { io } from "socket.io-client"

// Un único socket compartido por toda la sesión del dashboard (lo abre Dashboard.jsx
// al entrar y lo usan tanto el badge de "Mensajes" como la pantalla de chat de cada
// proyecto). Evita abrir una conexión nueva por cada componente que necesite el chat.
let socket = null

export const getSocket = (token) => {
  if (socket && socket.connected) return socket
  if (socket) socket.disconnect()

  socket = io(import.meta.env.VITE_BACKEND_URL, {
    transports: ["websocket"],
    auth: { token },
  })
  return socket
}

export const closeSocket = () => {
  socket?.disconnect()
  socket = null
}
