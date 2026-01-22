export const chatSocket = (io) => {
    io.on("connection", (socket) => {
        console.log("🟢 Usuario conectado:", socket.id);

        socket.on("enviar-mensaje-front-back", (payload) => {
        // envía a todos menos al que manda
        socket.broadcast.emit("enviar-mensaje-front-back", payload);
        });

        socket.on("disconnect", () => {
        console.log("🔴 Usuario desconectado:", socket.id);
        });
    });
};
