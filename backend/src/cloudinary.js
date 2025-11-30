import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

// Cargar variables de entorno ANTES de configurar Cloudinary
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
  
});

console.log("CLOUDINARY API KEY:", process.env.CLOUDINARY_API_KEY);
export default cloudinary;
