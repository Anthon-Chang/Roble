// Debe importarse antes que cualquier módulo que lea process.env al cargarse.
import dotenv from "dotenv"

dotenv.config()

// Sin secreto el servidor no debe arrancar: jwt.sign/verify con `undefined` falla de forma confusa
// y un secreto débil permite falsificar sesiones.
if (!process.env.JWT_SECRET) {
  throw new Error("Falta la variable de entorno JWT_SECRET: el servidor no puede arrancar sin ella")
}
if (process.env.JWT_SECRET.length < 16 && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET es demasiado corto: usa al menos 32 caracteres aleatorios")
}
