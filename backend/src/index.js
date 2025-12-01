import app from './server.js'
import { connectDB } from './database.js';

connectDB();

app.listen(app.get('port'),()=>{
    console.log(`Server ok on http://localhost:${app.get('port')}`);
})