import "./config/env.js";
import app from "./server.js";
import { conectarFirebase } from "./config/firebase.js";

import http from "http";
import { Server } from "socket.io";
import { chatSocket } from "./sockets/chat.socket.js";

// Verificar la conexión con Firebase (Firestore y Storage)
await conectarFirebase();

// Crear servidor HTTP
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://rob1e.netlify.app"
    ],
    methods: ["GET", "POST"]
  }
});

// Inicializar sockets
chatSocket(io);

// Levantar servidor
server.listen(app.get("port"), () => {
  console.log(`🚀 Server ok on http://localhost:${app.get("port")}`);
});
