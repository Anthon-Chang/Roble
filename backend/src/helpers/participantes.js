// Compartido entre el socket de chat (chat.socket.js) y el historial REST (mensaje_controller.js):
// solo el carpintero dueño del proyecto y el cliente del proyecto pueden ver/enviar mensajes.
// El administrador puede leer el historial (soporte/auditoría) pero no participa en el chat en vivo.
export const esParticipante = (proyecto, user) =>
    !!proyecto &&
    proyecto.estadoProyecto !== false &&
    ((user.rol === "carpintero" && proyecto.carpintero === user._id) ||
        (user.rol === "cliente" && proyecto.cliente === user._id))

export const puedeVerHistorial = (proyecto, user) =>
    !!proyecto && (user.rol === "administrador" || esParticipante(proyecto, user))
