import mongoose, { Schema, model } from "mongoose"

const estadoSchema = new Schema({

    nombre: {
        type: String,
        required: true,
        trim: true
    },

    detalle: {
        type: String,
        required: true,
        trim: true
    },

    prioridad: {
        type: String,
        required: true,
        enum: ["Baja", "Media", "Alta"]
    },

    precio: {
        type: Number,
        required: true,
        min: 1
    },

    estadoPago: {
        type: String,
        enum: ["Pendiente", "Pagado"],
        default: "Pendiente"
    },

    // 🔗 Relación con Proyecto
    proyecto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Proyecto",
        required: true
    }

}, {
    timestamps: true
})

export default model("Estado", estadoSchema)
