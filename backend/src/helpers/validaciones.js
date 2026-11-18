// Validaciones de formularios compartidas por cuentas, perfiles y proyectos.
// Cada función devuelve { valor } (ya normalizado) o { error } con el mensaje para el usuario.

const aTexto = (valor) => (typeof valor === "string" ? valor.trim() : "")

// Letras (con tildes y ñ) separadas por un solo espacio: sin dígitos ni caracteres especiales.
const SOLO_LETRAS = /^\p{L}+(?: \p{L}+)*$/u
// Dirección: letras, números, espacios y los signos habituales (. , # - / °). Nada que pueda ser HTML o código.
const DIRECCION = /^[\p{L}\p{N}][\p{L}\p{N} .,#\-/°]*$/u

export const LIMITES = {
    nombre: { min: 2, max: 50 },
    nombreCompleto: { min: 3, max: 100 },
    direccion: { min: 5, max: 100 },
    email: { max: 100 },
    password: { min: 8, maxBytes: 72 }, // bcrypt ignora lo que pase de 72 bytes
    aniosExperiencia: { min: 0, max: 60 },
}

// Texto de solo letras. `etiqueta` es el nombre del campo tal como lo ve el usuario ("El nombre").
const soloLetras = (valor, etiqueta, { min, max }) => {
    const limpio = aTexto(valor).replace(/\s+/g, " ")
    if (!limpio) return { error: `${etiqueta} es obligatorio` }
    if (limpio.length < min) return { error: `${etiqueta} debe tener al menos ${min} caracteres` }
    if (limpio.length > max) return { error: `${etiqueta} no puede superar ${max} caracteres` }
    if (!SOLO_LETRAS.test(limpio)) return { error: `${etiqueta} solo puede contener letras y espacios` }
    return { valor: limpio }
}

export const validarNombre = (valor, etiqueta = "El nombre") => soloLetras(valor, etiqueta, LIMITES.nombre)
export const validarApellido = (valor) => soloLetras(valor, "El apellido", LIMITES.nombre)
// Nombre y apellido en un solo campo (clientes que registra un carpintero)
export const validarNombreCompleto = (valor, etiqueta = "El nombre del cliente") =>
    soloLetras(valor, etiqueta, LIMITES.nombreCompleto)

export const validarDireccion = (valor) => {
    const limpio = aTexto(valor).replace(/\s+/g, " ")
    const { min, max } = LIMITES.direccion
    if (!limpio) return { error: "La dirección es obligatoria" }
    if (limpio.length < min) return { error: `La dirección debe tener al menos ${min} caracteres` }
    if (limpio.length > max) return { error: `La dirección no puede superar ${max} caracteres` }
    if (!DIRECCION.test(limpio)) {
        return { error: "La dirección solo puede contener letras, números, espacios y los signos . , # - / °" }
    }
    return { valor: limpio }
}

// Celular: exactamente 10 dígitos
export const validarCelular = (valor, etiqueta = "El celular") => {
    const limpio = aTexto(typeof valor === "number" ? String(valor) : valor)
    if (!limpio) return { error: `${etiqueta} es obligatorio` }
    if (!/^\d{10}$/.test(limpio)) return { error: `${etiqueta} debe tener exactamente 10 dígitos numéricos` }
    return { valor: limpio }
}

// Cédula: exactamente 10 dígitos (no se valida el dígito verificador)
export const validarCedula = (valor, etiqueta = "La cédula") => {
    const limpio = aTexto(typeof valor === "number" ? String(valor) : valor)
    if (!limpio) return { error: `${etiqueta} es obligatoria` }
    if (!/^\d{10}$/.test(limpio)) return { error: `${etiqueta} debe tener exactamente 10 dígitos numéricos` }
    return { valor: limpio }
}

export const validarPassword = (valor) => {
    if (typeof valor !== "string" || valor === "") return { error: "El password es obligatorio" }
    if (valor.length < LIMITES.password.min) {
        return { error: `El password debe tener al menos ${LIMITES.password.min} caracteres` }
    }
    if (Buffer.byteLength(valor) > LIMITES.password.maxBytes) {
        return { error: "El password es demasiado largo (máximo 72 caracteres)" }
    }
    return { valor }
}

export const validarAniosExperiencia = (valor) => {
    if (valor === undefined || valor === null || valor === "") return { valor: 0 }
    const numero = Number(valor)
    const { min, max } = LIMITES.aniosExperiencia
    if (!Number.isInteger(numero) || numero < min || numero > max) {
        return { error: `Los años de experiencia deben ser un número entero entre ${min} y ${max}` }
    }
    return { valor: numero }
}

export const validarLongitudEmail = (email) =>
    aTexto(email).length > LIMITES.email.max ? { error: `El correo no puede superar ${LIMITES.email.max} caracteres` } : {}

// Fecha de entrega: válida y no estar en el pasado.
export const leerFechaEntrega = (valor) => {
    const fecha = new Date(valor)
    if (Number.isNaN(fecha.getTime())) return { error: "La fecha de entrega no es válida" }
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    if (fecha < hoy) return { error: "La fecha de entrega no puede estar en el pasado" }
    return { fecha }
}

// Recorre validaciones { campo: resultado } y devuelve el primer error, o los valores normalizados.
export const combinar = (resultados) => {
    const valores = {}
    for (const [campo, r] of Object.entries(resultados)) {
        if (r.error) return { error: r.error }
        valores[campo] = r.valor
    }
    return { valores }
}
