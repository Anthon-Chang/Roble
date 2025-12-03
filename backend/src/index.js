import app from './server.js'
import { connectDB } from './database.js';

import cors from "cors";

app.use(cors({
  origin: "https://rob1e.netlify.app", // o la URL de tu frontend: "https://TU_FRONTEND.netlify.app"
  methods: "GET,POST,PUT,DELETE"
}));
connectDB();

app.listen(app.get('port'),()=>{
    console.log(`Server ok on http://localhost:${app.get('port')}`);
})