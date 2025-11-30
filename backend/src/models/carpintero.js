import { Schema, model } from 'mongoose'
import bcrypt from "bcryptjs"

const carpinteroSchema = new Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    apellido: {
        type: String,
        required: true,
        trim: true
    },
    direccion: {
        type: String,
        trim: true,
        default: null
    },
    celular: {
        type: String,
        trim: true,
        default: null
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    anios_experiencia: {
        type: Number,
        default: 0
    },
    status: {
        type: Boolean,
        default: true
    },
    token: {
        type: String,
        default: null
    },
    confirmEmail: {
        type: Boolean,
        default: false
    },
    rol: {
        type: String,
        default: "carpintero"
    }
}, {
    timestamps: true
})

// 🔐 Método para cifrar el password
carpinteroSchema.methods.encryptPassword = async function (password) {
    const salt = await bcrypt.genSalt(10)
    const passwordEncryp = await bcrypt.hash(password, salt)
    return passwordEncryp
}

// 🔍 Método para verificar si el password coincide
carpinteroSchema.methods.matchPassword = async function (password) {
    const response = await bcrypt.compare(password, this.password)
    return response
}

// 🧾 Método para crear un token
carpinteroSchema.methods.createToken = function () {
    const tokenGenerado = Math.random().toString(36).slice(2)
    this.token = tokenGenerado
    return tokenGenerado
}

export default model('Carpintero', carpinteroSchema)
