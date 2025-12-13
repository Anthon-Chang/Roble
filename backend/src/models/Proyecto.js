import mongoose, { Schema, model } from "mongoose";
import bcrypt from "bcryptjs"

const proyectoSchema = new Schema({
    nombreCliente: {
        type: String,
        required: true,
        trim: true
    },
    cedulaCliente:{
        type:String,
        required:true,
        trim:true
    },
    emailCliente:{
        type:String,
        required:true,
        trim:true,
        unique: true
    },
    passwordCliente:{
        type:String,
        required:true
    },
    celularCliente:{
        type:String,
        required:true,
        trim:true
    },
    nombreProyecto: {
    type: String,
    required: true,
    trim: true
    },
    descripcionProyecto: {
        type: String,
        required: true,
        trim: true
    },
    imagenProyecto: {
    type: String,
    default: null
    },
    imagenProyectoID: {
    type: String,
    default: null
    },
    imagenProyectoIA:{
        type:String,
        trim:true
    },
    estadoProyecto: {
        type: String,
        enum: ["pendiente", "en_progreso", "completado"],
        default: "pendiente"
    },
    fechaEntrega: {
        type: Date,
        trim: true,
        default: null
    },
    precioProyecto: {
        type: Number,
        default: 0
    },
    carpintero: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Carpintero"
    }
}, {
    timestamps: true
});

// Método para cifrar el password
proyectoSchema.methods.encryptPassword = async function(password){
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(password, salt)
}


// Método para verificar si el password es el mismo de la BDD
proyectoSchema.methods.matchPassword = async function(password){
    return bcrypt.compare(password, this.passwordPropietario)
}

export default model("Proyecto", proyectoSchema);
