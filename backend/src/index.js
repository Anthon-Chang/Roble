import "./config/env.js";
import app from "./server.js";
import { conectarFirebase } from "./config/firebase.js";

import http from "http";
import { Server } from "socket.io";
import { chatSocket } from "./sockets/chat.socket.js";
import { origenPermitido } from "./config/cors.js";

// Verificar la conexión con Firebase (Firestore y Storage)
await conectarFirebase();

// Crear servidor HTTP
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  // Misma allowlist que la API REST (config/cors.js)
  cors: {
    origin: (origen, callback) => callback(null, origenPermitido(origen)),
    methods: ["GET", "POST"],
  },
  // CORS no protege el transporte WebSocket: se comprueba el Origin también en el handshake
  allowRequest: (req, callback) => callback(null, origenPermitido(req.headers.origin)),
  // Mensajes pequeños: evita cargas enormes por una sola conexión
  maxHttpBufferSize: 1e5,
});

// Inicializar sockets
chatSocket(io);

// Levantar servidor
server.listen(app.get("port"), () => {
  console.log(`🚀 Server ok on http://localhost:${app.get("port")}`);
});
