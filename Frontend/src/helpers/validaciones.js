// Reglas reutilizables para react-hook-form

const DOMINIOS = "com|ec|gob|edu|org|net|info"

export const REGEX = {
  // usuario@dominio.com / .ec / .gob / .edu / .org ... (acepta .com.ec, .gob.ec, .edu.ec)
  email: new RegExp(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\\.[a-zA-Z0-9-]+)*\\.(${DOMINIOS})$`, "i"),
  soloNumeros: /^\d+$/,
  nombre: /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+(?:[ '-][A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)*$/,
}

export const reglaEmail = {
  required: "El correo electrónico es obligatorio",
  setValueAs: (v) => (typeof v === "string" ? v.trim() : v),
  validate: (v) =>
    REGEX.email.test(v || "") ||
    "Correo inválido: debe tener @ y terminar en .com, .ec, .gob, .edu, .org, etc.",
}

export const reglaPasswordNueva = {
  required: "La contraseña es obligatoria",
  minLength: { value: 8, message: "Mínimo 8 caracteres" },
  maxLength: { value: 64, message: "Máximo 64 caracteres" },
  validate: {
    sinEspacios: (v) => !/\s/.test(v) || "No puede contener espacios",
    mayuscula: (v) => /[A-Z]/.test(v) || "Debe incluir al menos una mayúscula",
    minuscula: (v) => /[a-z]/.test(v) || "Debe incluir al menos una minúscula",
    numero: (v) => /\d/.test(v) || "Debe incluir al menos un número",
    especial: (v) =>
      /[^A-Za-z0-9\s]/.test(v) || "Debe incluir al menos un carácter especial (@, #, $, !, etc.)",
  },
}

// Para login: solo obligatoria (las cuentas antiguas no deben quedar bloqueadas)
export const reglaPasswordLogin = { required: "La contraseña es obligatoria" }

// Cédula o RUC: 10 a 13 dígitos
export const reglaCedulaRuc = (obligatorio = true) => ({
  required: obligatorio ? "La cédula o RUC es obligatorio" : false,
  validate: (v) =>!v ||(
      REGEX.soloNumeros.test(v) &&
      (v.length === 10 ||(v.length === 13 && v.endsWith("001")))
    ) ||"Ingrese una cédula de 10 dígitos o un RUC de 13 dígitos que termine en 001",
});

// Celular: exactamente 10 dígitos
export const reglaCelular = (obligatorio = true) => ({
  required: obligatorio ? "El celular es obligatorio" : false,
  validate: (v) =>
    !v || (REGEX.soloNumeros.test(v) && v.length === 10) || "El celular debe tener 10 dígitos",
})

// Teléfono (convencional u otro): 10 a 13 dígitos
export const reglaTelefono = (obligatorio = true) => ({
  required: obligatorio ? "El teléfono es obligatorio" : false,
  validate: (v) =>
    !v ||
    (REGEX.soloNumeros.test(v) && v.length >= 10 && v.length <= 13) ||
    "El teléfono debe tener entre 10 y 13 dígitos",
})

export const reglaNombre = (etiqueta = "El nombre") => ({
  required: `${etiqueta} es obligatorio`,
  minLength: { value: 2, message: "Mínimo 2 caracteres" },
  maxLength: { value: 40, message: "Máximo 40 caracteres" },
  validate: (v) => REGEX.nombre.test(v.trim()) || "Solo se permiten letras",
})

export const reglaTextoCorto = (etiqueta, min = 3, max = 100) => ({
  required: `${etiqueta} es obligatorio`,
  validate: (v) => {
    const t = (v || "").trim()
    if (t.length < min) return `Mínimo ${min} caracteres`
    if (t.length > max) return `Máximo ${max} caracteres`
    return true
  },
})

// Para onInput: impide escribir letras y corta al máximo de dígitos
export const soloDigitos = (max) => (e) => {
  e.target.value = e.target.value.replace(/\D/g, "").slice(0, max)
}

export const hoyISO = () => new Date().toISOString().slice(0, 10)