import { v2 as cloudinary } from "cloudinary";
import fs from "fs-extra";

// ================================
// SUBIR ARCHIVO A CLOUDINARY
// ================================
const subirImagenCloudinary = async (filePath, folder = "Roble") => {
    try {
        const { secure_url, public_id } = await cloudinary.uploader.upload(filePath, {
            folder,
            resource_type: "auto",
        });

        // Elimina archivo temporal
        await fs.unlink(filePath);

        return { secure_url, public_id };

    } catch (error) {
        console.error("❌ Error al subir imagen a Cloudinary:", error);
        throw new Error("Error al subir la imagen");
    }
};

// ================================
// SUBIR BASE64 A CLOUDINARY
// ================================
const subirBase64Cloudinary = async (base64, folder = "Roble") => {
    try {
        const buffer = Buffer.from(
            base64.replace(/^data:image\/\w+;base64,/, ""),
            "base64"
        );

        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder, resource_type: "auto" },
                (err, res) => {
                    if (err) reject(err);
                    else resolve(res);
                }
            );

            stream.end(buffer);
        });

        return result.secure_url;

    } catch (error) {
        console.error("❌ Error al subir base64 a Cloudinary:", error);
        throw new Error("Error al subir la imagen en base64");
    }
};

/*
export { 
    subirImagenCloudinary, 
    subirBase64Cloudinary 
};
*/
export {
    subirImagenCloudinary,
    subirBase64Cloudinary
};
