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
    type: Boolean,
    default: true
    },
    fechaEntrega: {
        type: Date,
        trim: true,
        default: null
    },
    carpintero: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Carpintero"
    },
    estados: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Estado"
    }
]

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
    return await bcrypt.compare(password, this.passwordCliente)
}


export default model("Proyecto", proyectoSchema);
