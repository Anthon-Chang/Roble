import mongoose from "mongoose";

mongoose.set("strictQuery", true);

export const connectDB = async () => {
    try {
    const URI = process.env.MONGO_URI || process.env.MONGODB_URI_LOCAL;

    if (!URI) {
        throw new Error(
            "❌ No se encontró ninguna variable de entorno: MONGO_URI o MONGODB_URI_LOCAL"
        );
    }

    const { connection } = await mongoose.connect(URI);

    console.log(
        `✅ Base de datos conectada: ${connection.host}:${connection.port}`
    );
    } catch (error) {
        nsole.error("❌ Error al conectar a MongoDB:", error.message);
        process.exit(1);
    }
};

export default connectDB;
