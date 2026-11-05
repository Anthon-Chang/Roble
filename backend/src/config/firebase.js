import "./env.js"
import { initializeApp, getApps, getApp, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getStorage } from "firebase-admin/storage"

let db = null
let bucket = null

const leerCredenciales = () => {
    // Opción B: JSON completo de la cuenta de servicio (texto JSON o en base64)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const bruto = process.env.FIREBASE_SERVICE_ACCOUNT.trim()
        const texto = bruto.startsWith("{") ? bruto : Buffer.from(bruto, "base64").toString("utf8")
        return JSON.parse(texto)
    }

    // Opción A: variables sueltas
    const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env
    if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
        throw new Error(
            "Faltan credenciales de Firebase: define FIREBASE_SERVICE_ACCOUNT o FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY"
        )
    }
    return {
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }
}

const inicializar = () => {
    if (!getApps().length) {
        // Con los emuladores de Firebase no se necesitan credenciales reales.
        const usaEmulador = Boolean(process.env.FIRESTORE_EMULATOR_HOST)
        initializeApp(
            usaEmulador
                ? {
                      projectId: process.env.FIREBASE_PROJECT_ID || "demo-roble",
                      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "demo-roble.appspot.com",
                  }
                : {
                      credential: cert(leerCredenciales()),
                      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
                  }
        )
        if (usaEmulador) console.log(`🧪 Usando emuladores de Firebase (Firestore ${process.env.FIRESTORE_EMULATOR_HOST})`)
    }
    db = getFirestore(getApp())
    db.settings({ ignoreUndefinedProperties: true })
    bucket = getStorage(getApp()).bucket()
}

export const getDb = () => {
    if (!db) inicializar()
    return db
}

export const getBucket = () => {
    if (!bucket) inicializar()
    return bucket
}

// Verifica que Firestore responde; se usa al arrancar el servidor.
export const conectarFirebase = async () => {
    try {
        await getDb().collection("_salud").limit(1).get()
        console.log(`✅ Firebase conectado (Firestore y Storage: ${getBucket().name})`)
    } catch (error) {
        console.error("❌ Error al conectar con Firebase:", error.message)
        process.exit(1)
    }
}

// Solo para pruebas: permite inyectar un Firestore y un bucket simulados.
export const __usarFirebaseSimulado = ({ db: dbSimulado, bucket: bucketSimulado }) => {
    db = dbSimulado
    bucket = bucketSimulado
}
