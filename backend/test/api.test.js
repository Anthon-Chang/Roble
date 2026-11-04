// Pruebas de integración con Firestore y Storage simulados (no requieren credenciales ni red).
import { test, before, after, describe } from "node:test"
import assert from "node:assert/strict"
import { crearFirestoreSimulado, crearBucketSimulado } from "./firebaseSimulado.js"

process.env.JWT_SECRET = "secreto-de-prueba"
process.env.STRIPE_PRIVATE_KEY = "sk_test_falsa"
process.env.RESEND_API_KEY = "re_falsa"
process.env.URL_FRONTEND = "http://localhost:5173/"
process.env.GOOGLE_CLIENT_ID = "google-falso"
process.env.NODE_ENV = "test"
delete process.env.ADMIN_NOTIFY_EMAIL

const db = crearFirestoreSimulado()
const bucket = crearBucketSimulado()

// Los correos (Resend) se interceptan y se guardan para poder leer contraseñas temporales
const correos = []
const fetchReal = globalThis.fetch
globalThis.fetch = async (url, opciones) => {
    if (String(url).includes("resend.com")) {
        correos.push(JSON.parse(opciones.body))
        return new Response(JSON.stringify({ id: "correo-simulado" }), { status: 200, headers: { "content-type": "application/json" } })
    }
    return fetchReal(url, opciones)
}

let servidor, base
let Administrador, encryptPassword

before(async () => {
    const { __usarFirebaseSimulado } = await import("../src/config/firebase.js")
    __usarFirebaseSimulado({ db, bucket })
    const { default: app } = await import("../src/server.js")
    ;({ default: Administrador } = await import("../src/models/Administrador.js"))
    ;({ encryptPassword } = await import("../src/helpers/password.js"))
    servidor = app.listen(0)
    base = `http://127.0.0.1:${servidor.address().port}`
})

after(() => servidor.close())

// ---------- utilidades ----------
const api = async (metodo, ruta, { token, json, form } = {}) => {
    const headers = {}
    if (token) headers.Authorization = `Bearer ${token}`
    let body
    if (json) { headers["Content-Type"] = "application/json"; body = JSON.stringify(json) }
    if (form) body = form
    const res = await fetch(base + ruta, { method: metodo, headers, body })
    let datos = null
    try { datos = await res.json() } catch { /* sin cuerpo */ }
    return { status: res.status, datos }
}

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)])
const PDF = Buffer.from("%PDF-1.4\n%contenido de prueba\n")
const GLB = Buffer.concat([Buffer.from("glTF"), Buffer.alloc(64)])

const formulario = (campos = {}, archivos = {}) => {
    const form = new FormData()
    for (const [k, v] of Object.entries(campos)) form.append(k, v)
    for (const [k, lista] of Object.entries(archivos)) {
        for (const { nombre, contenido, tipo } of [].concat(lista)) {
            form.append(k, new Blob([contenido], { type: tipo }), nombre)
        }
    }
    return form
}

const futuro = () => new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)

let contador = 0
const crearCarpintero = async ({ aprobar = false, cv = true } = {}) => {
    contador++
    const email = `carp${contador}@test.com`
    const registro = await api("POST", "/api/carpintero/registro", {
        json: { nombre: "Juan", apellido: `Perez${contador}`, email, password: "clave12345", celular: "0999999999" },
    })
    assert.equal(registro.status, 201)
    const doc = [...db.collection("carpinteros").datos.entries()].find(([, d]) => d.email === email)
    const [id, datos] = doc
    const confirmar = await api("GET", `/api/carpintero/confirmar/${datos.token}`)
    assert.equal(confirmar.status, 200)
    const login = await api("POST", "/api/carpintero/login", { json: { email, password: "clave12345" } })
    assert.equal(login.status, 200)
    const token = login.datos.token
    if (cv) {
        const subida = await api("POST", "/api/carpintero/cv", { token, form: formulario({}, { cv: { nombre: "cv.pdf", contenido: PDF, tipo: "application/pdf" } }) })
        assert.equal(subida.status, 200)
    }
    if (aprobar) {
        const admin = await tokenAdmin()
        const r = await api("PUT", `/api/carpintero/aprobar-no-existe`, { token: admin }) // ruta inexistente a propósito
        assert.equal(r.status, 404)
        const ok = await api("PUT", `/api/admin/carpinteros/${id}/aprobar`, { token: admin })
        assert.equal(ok.status, 200)
    }
    return { id, email, token }
}

let adminToken
const tokenAdmin = async () => {
    if (adminToken) return adminToken
    await Administrador.crear({ nombre: "Admin", email: "admin@test.com", password: await encryptPassword("admin12345") })
    const login = await api("POST", "/api/admin/login", { json: { email: "admin@test.com", password: "admin12345" } })
    assert.equal(login.status, 200)
    adminToken = login.datos.token
    return adminToken
}

let contadorClientes = 0
const crearCliente = async () => {
    contadorClientes++
    const email = `cliente${contadorClientes}@test.com`
    const registro = await api("POST", "/api/cliente/registro", {
        json: { nombre: "Ana", apellido: "Lopez", email, password: "clave12345", cedula: `17000000${String(contadorClientes).padStart(2, "0")}`, celular: "0988888888" },
    })
    assert.equal(registro.status, 201)
    const login = await api("POST", "/api/cliente/login", { json: { email, password: "clave12345" } })
    assert.equal(login.status, 200)
    return { email, token: login.datos.token, id: login.datos._id }
}

// ---------- Sprint 1 ----------
describe("HU-003 Crear cuenta de carpintero", () => {
    test("no permite asignarse rol ni aprobación al registrarse", async () => {
        const r = await api("POST", "/api/carpintero/registro", {
            json: { nombre: "Mal", apellido: "Actor", email: "malo@test.com", password: "clave12345", rol: "administrador", estadoAprobacion: "aprobado", confirmEmail: true },
        })
        assert.equal(r.status, 201)
        const [, doc] = [...db.collection("carpinteros").datos.entries()].find(([, d]) => d.email === "malo@test.com")
        assert.equal(doc.rol, "carpintero")
        assert.equal(doc.estadoAprobacion, "pendiente")
        assert.equal(doc.confirmEmail, false)
        assert.notEqual(doc.password, "clave12345")
    })

    test("rechaza correo duplicado, campos faltantes, correo inválido y password corto", async () => {
        const base = { nombre: "A", apellido: "B", email: "dup@test.com", password: "clave12345" }
        assert.equal((await api("POST", "/api/carpintero/registro", { json: base })).status, 201)
        assert.equal((await api("POST", "/api/carpintero/registro", { json: base })).status, 400)
        assert.equal((await api("POST", "/api/carpintero/registro", { json: { ...base, email: "x@test.com", nombre: "" } })).status, 400)
        assert.equal((await api("POST", "/api/carpintero/registro", { json: { ...base, email: "no-es-correo" } })).status, 400)
        assert.equal((await api("POST", "/api/carpintero/registro", { json: { ...base, email: "y@test.com", password: "123" } })).status, 400)
    })

    test("no permite iniciar sesión sin confirmar el correo", async () => {
        await api("POST", "/api/carpintero/registro", { json: { nombre: "A", apellido: "B", email: "sinconfirmar@test.com", password: "clave12345" } })
        const r = await api("POST", "/api/carpintero/login", { json: { email: "sinconfirmar@test.com", password: "clave12345" } })
        assert.equal(r.status, 403)
    })
})

describe("HU-004 Cargar CV", () => {
    test("solo acepta PDF reales y solo de carpinteros", async () => {
        const c = await crearCarpintero({ cv: false })
        const cliente = await crearCliente()

        const noPdf = await api("POST", "/api/carpintero/cv", { token: c.token, form: formulario({}, { cv: { nombre: "cv.docx", contenido: PDF, tipo: "application/msword" } }) })
        assert.equal(noPdf.status, 400)

        const pdfFalso = await api("POST", "/api/carpintero/cv", { token: c.token, form: formulario({}, { cv: { nombre: "cv.pdf", contenido: Buffer.from("no soy pdf"), tipo: "application/pdf" } }) })
        assert.equal(pdfFalso.status, 400)

        const delCliente = await api("POST", "/api/carpintero/cv", { token: cliente.token, form: formulario({}, { cv: { nombre: "cv.pdf", contenido: PDF, tipo: "application/pdf" } }) })
        assert.equal(delCliente.status, 403)

        const ok = await api("POST", "/api/carpintero/cv", { token: c.token, form: formulario({}, { cv: { nombre: "cv.pdf", contenido: PDF, tipo: "application/pdf" } }) })
        assert.equal(ok.status, 200)
        assert.match(ok.datos.cvUrl, /firebasestorage\.googleapis\.com/)
        assert.ok(bucket.archivos.has(`cvs/${c.id}/cv.pdf`))

        const mio = await api("GET", "/api/carpintero/cv", { token: c.token })
        assert.equal(mio.status, 200)
    })
})

describe("HU-001 / HU-002 Administrador", () => {
    test("solo el administrador lista usuarios y aprueba perfiles", async () => {
        const admin = await tokenAdmin()
        const c = await crearCarpintero()
        const cliente = await crearCliente()

        assert.equal((await api("GET", "/api/admin/usuarios")).status, 401)
        assert.equal((await api("GET", "/api/admin/usuarios", { token: c.token })).status, 403)
        assert.equal((await api("GET", "/api/admin/usuarios", { token: cliente.token })).status, 403)

        const lista = await api("GET", "/api/admin/usuarios?rol=carpintero&estadoAprobacion=pendiente", { token: admin })
        assert.equal(lista.status, 200)
        assert.ok(lista.datos.some((u) => u._id === c.id))
        assert.ok(lista.datos.every((u) => u.password === undefined && u.token === undefined))

        const todos = await api("GET", "/api/admin/usuarios", { token: admin })
        assert.ok(todos.datos.some((u) => u.rol === "cliente"))
        assert.equal((await api("GET", "/api/admin/usuarios?rol=otro", { token: admin })).status, 400)

        assert.equal((await api("PUT", `/api/admin/carpinteros/${c.id}/aprobar`, { token: c.token })).status, 403)
        const aprobado = await api("PUT", `/api/admin/carpinteros/${c.id}/aprobar`, { token: admin })
        assert.equal(aprobado.status, 200)
        assert.equal(aprobado.datos.carpintero.estadoAprobacion, "aprobado")
    })

    test("no aprueba sin CV y exige motivo para rechazar", async () => {
        const admin = await tokenAdmin()
        const sinCv = await crearCarpintero({ cv: false })
        assert.equal((await api("PUT", `/api/admin/carpinteros/${sinCv.id}/aprobar`, { token: admin })).status, 400)
        assert.equal((await api("PUT", `/api/admin/carpinteros/${sinCv.id}/rechazar`, { token: admin, json: {} })).status, 400)
        const rechazo = await api("PUT", `/api/admin/carpinteros/${sinCv.id}/rechazar`, { token: admin, json: { motivo: "CV incompleto" } })
        assert.equal(rechazo.status, 200)
        assert.equal(rechazo.datos.carpintero.motivoRechazo, "CV incompleto")
        assert.equal((await api("PUT", "/api/admin/carpinteros/no-existe/aprobar", { token: admin })).status, 404)
    })

    test("un perfil rechazado vuelve a pendiente al subir un CV nuevo", async () => {
        const admin = await tokenAdmin()
        const c = await crearCarpintero()
        await api("PUT", `/api/admin/carpinteros/${c.id}/rechazar`, { token: admin, json: { motivo: "Falta experiencia" } })
        const subida = await api("PUT", "/api/carpintero/cv", { token: c.token, form: formulario({}, { cv: { nombre: "cv.pdf", contenido: PDF, tipo: "application/pdf" } }) })
        assert.equal(subida.status, 200)
        assert.equal(subida.datos.estadoAprobacion, "pendiente")
    })
})

describe("HU-005 Crear cuenta de cliente", () => {
    test("registra, rechaza duplicados y permite iniciar sesión", async () => {
        const cliente = await crearCliente()
        const dup = await api("POST", "/api/cliente/registro", { json: { nombre: "Ana", apellido: "Lopez", email: cliente.email, password: "clave12345" } })
        assert.equal(dup.status, 400)
        assert.equal((await api("POST", "/api/cliente/registro", { json: { nombre: "Ana", email: "z@test.com", password: "clave12345" } })).status, 400)
        assert.equal((await api("POST", "/api/cliente/login", { json: { email: cliente.email, password: "incorrecta1" } })).status, 401)

        const perfil = await api("GET", "/api/cliente/perfil", { token: cliente.token })
        assert.equal(perfil.status, 200)
        assert.equal(perfil.datos.password, undefined)
    })
})

describe("HU-006 Gestionar mobiliario", () => {
    test("un carpintero sin aprobar no puede registrar mobiliario", async () => {
        const c = await crearCarpintero()
        const r = await api("POST", "/api/mueble", { token: c.token, form: formulario({ nombre: "Mesa", descripcion: "Mesa de roble" }) })
        assert.equal(r.status, 403)
    })

    test("CRUD solo sobre muebles propios, con imágenes en Storage", async () => {
        const dueno = await crearCarpintero({ aprobar: true })
        const otro = await crearCarpintero({ aprobar: true })

        const sinNombre = await api("POST", "/api/mueble", { token: dueno.token, form: formulario({ descripcion: "x" }) })
        assert.equal(sinNombre.status, 400)

        const imagenMala = await api("POST", "/api/mueble", {
            token: dueno.token,
            form: formulario({ nombre: "Silla", descripcion: "Silla" }, { imagenes: { nombre: "foto.png", contenido: Buffer.from("texto"), tipo: "image/png" } }),
        })
        assert.equal(imagenMala.status, 400)

        const creado = await api("POST", "/api/mueble", {
            token: dueno.token,
            form: formulario(
                { nombre: "Mesa", descripcion: "Mesa de roble", tipoMadera: "Roble", precio: "250" },
                { imagenes: { nombre: "mesa.png", contenido: PNG, tipo: "image/png" } }
            ),
        })
        assert.equal(creado.status, 201)
        const mueble = creado.datos.mueble
        assert.equal(mueble.carpintero, dueno.id)
        assert.equal(mueble.imagenes.length, 1)
        assert.ok(bucket.archivos.has(mueble.imagenes[0].path))

        assert.equal((await api("PUT", `/api/mueble/${mueble._id}`, { token: otro.token, json: { nombre: "Robada" } })).status, 403)
        assert.equal((await api("DELETE", `/api/mueble/${mueble._id}`, { token: otro.token })).status, 403)

        const editado = await api("PUT", `/api/mueble/${mueble._id}`, { token: dueno.token, form: formulario({ nombre: "Mesa grande", precio: "300" }) })
        assert.equal(editado.status, 200)
        assert.equal(editado.datos.mueble.nombre, "Mesa grande")
        assert.equal(editado.datos.mueble.precio, 300)

        const mios = await api("GET", "/api/mueble/mis-muebles", { token: dueno.token })
        assert.equal(mios.datos.length, 1)

        const eliminado = await api("DELETE", `/api/mueble/${mueble._id}`, { token: dueno.token })
        assert.equal(eliminado.status, 200)
        assert.equal(bucket.archivos.has(mueble.imagenes[0].path), false)
        assert.equal((await api("GET", `/api/mueble/${mueble._id}`, { token: dueno.token })).status, 404)
    })
})

// ---------- Sprint 2 ----------
describe("HU-007 / HU-008 Catálogo 3D", () => {
    test("solo carpinteros aprobados publican, valida formato y exige JWT para explorar", async () => {
        const aprobado = await crearCarpintero({ aprobar: true })
        const pendiente = await crearCarpintero()
        const cliente = await crearCliente()
        const glb = { nombre: "silla.glb", contenido: GLB, tipo: "model/gltf-binary" }

        assert.equal((await api("POST", "/api/models", { form: formulario({ name: "Silla" }, { modelo: glb }) })).status, 401)
        assert.equal((await api("POST", "/api/models", { token: cliente.token, form: formulario({ name: "Silla" }, { modelo: glb }) })).status, 403)
        assert.equal((await api("POST", "/api/models", { token: pendiente.token, form: formulario({ name: "Silla" }, { modelo: glb }) })).status, 403)

        const stl = await api("POST", "/api/models", { token: aprobado.token, form: formulario({ name: "X" }, { modelo: { nombre: "x.stl", contenido: GLB, tipo: "model/stl" } }) })
        assert.equal(stl.status, 400)
        const glbFalso = await api("POST", "/api/models", { token: aprobado.token, form: formulario({ name: "X" }, { modelo: { nombre: "x.glb", contenido: Buffer.from("no glb"), tipo: "model/gltf-binary" } }) })
        assert.equal(glbFalso.status, 400)
        const sinArchivo = await api("POST", "/api/models", { token: aprobado.token, form: formulario({ name: "Sin archivo" }) })
        assert.equal(sinArchivo.status, 400)

        const creado = await api("POST", "/api/models", { token: aprobado.token, form: formulario({ name: "Silla nórdica", description: "Silla" }, { modelo: glb }) })
        assert.equal(creado.status, 201)
        assert.equal(creado.datos.data.formato, "glb")
        assert.equal(creado.datos.data.carpintero, aprobado.id)
        assert.ok(bucket.archivos.has(creado.datos.data.modelPath))

        // El modelo de un carpintero sin aprobar no aparece en el catálogo
        const oculto = await db.collection("modelos3d").doc()
        await oculto.set({ name: "Silla oculta", modelUrl: "https://x.test/a.glb", carpintero: pendiente.id, createdAt: new Date() })

        assert.equal((await api("GET", "/api/models")).status, 401)
        const lista = await api("GET", "/api/models", { token: cliente.token })
        assert.equal(lista.status, 200)
        assert.ok(lista.datos.data.some((m) => m.name === "Silla nórdica"))
        assert.ok(!lista.datos.data.some((m) => m.name === "Silla oculta"))

        const busqueda = await api("GET", "/api/models/search?name=n%C3%B3rdica", { token: cliente.token })
        assert.equal(busqueda.status, 200)
        assert.equal(busqueda.datos.data._id, creado.datos.data._id)
        assert.equal((await api("GET", "/api/models/search?name=.*", { token: cliente.token })).status, 404) // sin regex
        assert.equal((await api("GET", "/api/models/search", { token: cliente.token })).status, 400)
        assert.equal((await api("GET", `/api/models/${oculto.id}`, { token: cliente.token })).status, 404)
    })

    test("editar y eliminar solo el dueño; elimina el archivo de Storage", async () => {
        const dueno = await crearCarpintero({ aprobar: true })
        const otro = await crearCarpintero({ aprobar: true })
        const creado = await api("POST", "/api/models", { token: dueno.token, form: formulario({ name: "Mesa" }, { modelo: { nombre: "mesa.obj", contenido: Buffer.from("v 0 0 0\nf 1 1 1\n"), tipo: "text/plain" } }) })
        assert.equal(creado.status, 201)
        const modelo = creado.datos.data

        assert.equal((await api("PUT", `/api/models/${modelo._id}`, { token: otro.token, json: { name: "Robado" } })).status, 403)
        assert.equal((await api("DELETE", `/api/models/${modelo._id}`, { token: otro.token })).status, 403)
        const editado = await api("PUT", `/api/models/${modelo._id}`, { token: dueno.token, form: formulario({ name: "Mesa 2" }) })
        assert.equal(editado.datos.data.name, "Mesa 2")

        assert.equal((await api("DELETE", `/api/models/${modelo._id}`, { token: dueno.token })).status, 200)
        assert.equal(bucket.archivos.has(modelo.modelPath), false)
        assert.equal((await api("GET", `/api/models/${modelo._id}`, { token: dueno.token })).status, 404)
    })

    test("catálogo vacío responde lista vacía sin error", async () => {
        const cliente = await crearCliente()
        const lista = await api("GET", "/api/models/mis-modelos", { token: cliente.token })
        assert.equal(lista.status, 403) // solo carpinteros
        const general = await api("GET", "/api/models", { token: cliente.token })
        assert.equal(general.status, 200)
        assert.ok(Array.isArray(general.datos.data))
    })
})

describe("HU-009 Perfiles profesionales", () => {
    test("lista solo aprobados, sin datos sensibles, con su CV y sus publicaciones", async () => {
        const aprobado = await crearCarpintero({ aprobar: true })
        const pendiente = await crearCarpintero()
        const cliente = await crearCliente()
        await api("POST", "/api/mueble", { token: aprobado.token, form: formulario({ nombre: "Repisa", descripcion: "Repisa" }) })

        assert.equal((await api("GET", "/api/carpintero/aprobados")).status, 401)
        const lista = await api("GET", "/api/carpintero/aprobados", { token: cliente.token })
        assert.equal(lista.status, 200)
        assert.ok(lista.datos.some((c) => c._id === aprobado.id))
        assert.ok(!lista.datos.some((c) => c._id === pendiente.id))
        assert.ok(lista.datos.every((c) => c.password === undefined && c.token === undefined && c.email === undefined))

        const detalle = await api("GET", `/api/carpintero/aprobados/${aprobado.id}`, { token: cliente.token })
        assert.equal(detalle.status, 200)
        assert.ok(detalle.datos.cvUrl)
        assert.equal(detalle.datos.muebles.length, 1)
        assert.equal(detalle.datos.password, undefined)
        assert.equal((await api("GET", `/api/carpintero/aprobados/${pendiente.id}`, { token: cliente.token })).status, 404)
    })
})

describe("HU-010 / HU-011 Proyectos y requerimientos", () => {
    test("el cliente genera un proyecto con un carpintero aprobado y este lo ve como requerimiento", async () => {
        const carpintero = await crearCarpintero({ aprobar: true })
        const sinAprobar = await crearCarpintero()
        const otroCarpintero = await crearCarpintero({ aprobar: true })
        const cliente = await crearCliente()
        const otroCliente = await crearCliente()
        const datos = { nombreProyecto: "Closet", descripcionProyecto: "Closet de 2 puertas", tipoMadera: "Cedro", fechaEntrega: futuro() }

        assert.equal((await api("POST", "/api/proyecto/solicitar", { token: carpintero.token, form: formulario({ ...datos, carpintero: carpintero.id }) })).status, 403)
        assert.equal((await api("POST", "/api/proyecto/solicitar", { token: cliente.token, form: formulario({ ...datos, carpintero: sinAprobar.id }) })).status, 400)
        assert.equal((await api("POST", "/api/proyecto/solicitar", { token: cliente.token, form: formulario({ ...datos, carpintero: "no-existe" }) })).status, 400)
        assert.equal((await api("POST", "/api/proyecto/solicitar", { token: cliente.token, form: formulario({ ...datos, fechaEntrega: "2020-01-01", carpintero: carpintero.id }) })).status, 400)
        assert.equal((await api("POST", "/api/proyecto/solicitar", { token: cliente.token, form: formulario({ ...datos, nombreProyecto: "", carpintero: carpintero.id }) })).status, 400)

        const ok = await api("POST", "/api/proyecto/solicitar", {
            token: cliente.token,
            form: formulario({ ...datos, carpintero: carpintero.id }, { imagenProyecto: { nombre: "ref.png", contenido: PNG, tipo: "image/png" } }),
        })
        assert.equal(ok.status, 201)
        const proyecto = ok.datos.proyecto
        assert.equal(proyecto.carpintero._id, carpintero.id)
        assert.equal(proyecto.cliente, cliente.id)
        assert.match(proyecto.imagenProyecto, /firebasestorage/)

        // Cliente: lista y detalle propios
        const miLista = await api("GET", "/api/proyecto/listar", { token: cliente.token })
        assert.equal(miLista.status, 200)
        assert.equal(miLista.datos.length, 1)
        assert.equal((await api("GET", `/api/proyecto/detalle/${proyecto._id}`, { token: cliente.token })).status, 200)
        assert.equal((await api("GET", `/api/proyecto/detalle/${proyecto._id}`, { token: otroCliente.token })).status, 403)
        assert.equal((await api("GET", `/api/proyecto/detalle/${proyecto._id}`, { token: otroCarpintero.token })).status, 403)

        // Carpintero: requerimientos asignados
        const req = await api("GET", "/api/proyecto/requerimientos", { token: carpintero.token })
        assert.equal(req.status, 200)
        assert.equal(req.datos.length, 1)
        assert.equal(req.datos[0].nombreCliente, "Ana Lopez")
        const detalle = await api("GET", `/api/proyecto/requerimientos/${proyecto._id}`, { token: carpintero.token })
        assert.equal(detalle.status, 200)
        assert.equal(detalle.datos.descripcionProyecto, "Closet de 2 puertas")

        // Otro carpintero no ve pedidos ajenos y recibe lista vacía (200)
        const vacio = await api("GET", "/api/proyecto/requerimientos", { token: otroCarpintero.token })
        assert.equal(vacio.status, 200)
        assert.deepEqual(vacio.datos, [])
        assert.equal((await api("GET", "/api/proyecto/requerimientos", { token: cliente.token })).status, 403)
    })

    test("actualizar y eliminar: solo el carpintero dueño, sin sobrescribir datos protegidos", async () => {
        const carpintero = await crearCarpintero({ aprobar: true })
        const otro = await crearCarpintero({ aprobar: true })
        const cliente = await crearCliente()
        const creado = await api("POST", "/api/proyecto/solicitar", {
            token: cliente.token,
            form: formulario({ nombreProyecto: "Mesa", descripcionProyecto: "Mesa comedor", fechaEntrega: futuro(), carpintero: carpintero.id }),
        })
        const id = creado.datos.proyecto._id

        // El cliente recibe 403 (antes fallaba con error 500)
        assert.equal((await api("PUT", `/api/proyecto/actualizar/${id}`, { token: cliente.token, json: { nombreProyecto: "X" } })).status, 403)
        assert.equal((await api("DELETE", `/api/proyecto/eliminar/${id}`, { token: cliente.token })).status, 403)
        assert.equal((await api("PUT", `/api/proyecto/actualizar/${id}`, { token: otro.token, json: { nombreProyecto: "X" } })).status, 403)

        const actualizado = await api("PUT", `/api/proyecto/actualizar/${id}`, {
            token: carpintero.token,
            json: { nombreProyecto: "Mesa de comedor", carpintero: otro.id, cliente: "otro", passwordCliente: "hack", estadoProyecto: false },
        })
        assert.equal(actualizado.status, 200)
        const guardado = db.collection("proyectos").datos.get(id)
        assert.equal(guardado.nombreProyecto, "Mesa de comedor")
        assert.equal(guardado.carpintero, carpintero.id)
        assert.equal(guardado.cliente, cliente.id)
        assert.equal(guardado.passwordCliente, undefined)
        assert.equal(guardado.estadoProyecto, true)

        assert.equal((await api("PUT", `/api/proyecto/actualizar/${id}`, { token: carpintero.token, json: { nombreProyecto: "" } })).status, 400)

        const eliminado = await api("DELETE", `/api/proyecto/eliminar/${id}`, { token: carpintero.token })
        assert.equal(eliminado.status, 200)
        assert.equal(eliminado.datos.msg, "Proyecto eliminado exitosamente")
        assert.equal(db.collection("proyectos").datos.get(id).estadoProyecto, false)
        assert.equal((await api("GET", "/api/proyecto/listar", { token: carpintero.token })).status, 404)
    })

    test("flujo existente: el carpintero registra el proyecto y el cliente entra con la contraseña temporal", async () => {
        const carpintero = await crearCarpintero({ aprobar: true })
        const sinAprobar = await crearCarpintero()
        const datos = {
            nombreCliente: "Pedro Gomez", cedulaCliente: "1712345678", emailCliente: "pedro@test.com", celularCliente: "0977777777",
            nombreProyecto: "Escritorio", descripcionProyecto: "Escritorio de trabajo", fechaEntrega: futuro(),
        }
        assert.equal((await api("POST", "/api/proyecto/registro", { token: sinAprobar.token, form: formulario(datos) })).status, 403)

        correos.length = 0
        const r = await api("POST", "/api/proyecto/registro", {
            token: carpintero.token,
            form: formulario(datos, { imagenProyecto: { nombre: "ref.png", contenido: PNG, tipo: "image/png" } }),
        })
        assert.equal(r.status, 201)
        const correo = correos.find((c) => c.to.includes("pedro@test.com"))
        const password = /Contraseña temporal:<\/strong>\s*(\S+?)</.exec(correo.html)?.[1]
        assert.ok(password, "el correo debe traer la contraseña temporal")

        const login = await api("POST", "/api/proyecto/login", { json: { emailCliente: "pedro@test.com", passwordCliente: password } })
        assert.equal(login.status, 200)
        assert.equal(login.datos.rol, "cliente")

        const perfil = await api("GET", "/api/proyecto/perfil", { token: login.datos.token })
        assert.equal(perfil.datos.nombreCliente, "Pedro Gomez")
        const detalle = await api("GET", `/api/proyecto/detalle/${login.datos._id}`, { token: login.datos.token })
        assert.equal(detalle.status, 200)
        assert.equal(detalle.datos.nombreProyecto, "Escritorio")
        assert.equal(detalle.datos.passwordCliente, undefined)

        // Segundo proyecto para el mismo cliente (antes el correo era único por proyecto)
        const segundo = await api("POST", "/api/proyecto/registro", { token: carpintero.token, form: formulario({ ...datos, nombreProyecto: "Librero" }) })
        assert.equal(segundo.status, 201)
    })
})

describe("Estados y seguridad general", () => {
    test("registrar estados solo el carpintero dueño; pagar solo el cliente dueño", async () => {
        const carpintero = await crearCarpintero({ aprobar: true })
        const otro = await crearCarpintero({ aprobar: true })
        const cliente = await crearCliente()
        const otroCliente = await crearCliente()
        const proyecto = (await api("POST", "/api/proyecto/solicitar", {
            token: cliente.token,
            form: formulario({ nombreProyecto: "Cama", descripcionProyecto: "Cama king", fechaEntrega: futuro(), carpintero: carpintero.id }),
        })).datos.proyecto
        const estado = { proyecto: proyecto._id, nombre: "Inicio", detalle: "Anticipo", prioridad: "Alta", precio: 100 }

        assert.equal((await api("POST", "/api/estado/registro", { token: cliente.token, json: estado })).status, 403)
        assert.equal((await api("POST", "/api/estado/registro", { token: otro.token, json: estado })).status, 403)
        assert.equal((await api("POST", "/api/estado/registro", { token: carpintero.token, json: { ...estado, prioridad: "Urgente" } })).status, 400)
        assert.equal((await api("POST", "/api/estado/registro", { token: carpintero.token, json: { ...estado, precio: 0 } })).status, 400)
        assert.equal((await api("POST", "/api/estado/registro", { token: carpintero.token, json: estado })).status, 201)

        const detalle = await api("GET", `/api/proyecto/detalle/${proyecto._id}`, { token: cliente.token })
        assert.equal(detalle.datos.estados.length, 1)
        const estadoId = detalle.datos.estados[0]._id

        // Pagar un estado ajeno se rechaza antes de llamar a Stripe
        const ajeno = await api("POST", "/api/estado/pagar", { token: otroCliente.token, json: { paymentMethodId: "pm_card_visa", estadoId } })
        assert.equal(ajeno.status, 403)
        assert.equal((await api("POST", "/api/estado/pagar", { token: carpintero.token, json: { paymentMethodId: "pm_x", estadoId } })).status, 403)

        assert.equal((await api("DELETE", `/api/estado/eliminar/${estadoId}`, { token: otro.token })).status, 403)
        assert.equal((await api("DELETE", `/api/estado/eliminar/${estadoId}`, { token: carpintero.token })).status, 200)
    })

    test("las rutas privadas exigen un token válido y la carpeta de subidas ya no es pública", async () => {
        assert.equal((await api("GET", "/api/mueble")).status, 401)
        assert.equal((await api("GET", "/api/proyecto/listar", { token: "token.falso.xyz" })).status, 401)
        const res = await fetch(`${base}/uploads/lo-que-sea`)
        assert.equal(res.status, 404)
    })

    test("la recuperación de contraseña usa un token que vence", async () => {
        const c = await crearCarpintero()
        const r = await api("POST", "/api/carpintero/recuperarpassword", { json: { email: c.email } })
        assert.equal(r.status, 200)
        const doc = db.collection("carpinteros").datos.get(c.id)
        assert.equal((await api("GET", `/api/carpintero/recuperarpassword/${doc.token}`)).status, 200)

        const cambio = await api("POST", `/api/carpintero/nuevopassword/${doc.token}`, { json: { password: "nueva12345", confirmpassword: "nueva12345" } })
        assert.equal(cambio.status, 200)
        assert.equal((await api("POST", "/api/carpintero/login", { json: { email: c.email, password: "nueva12345" } })).status, 200)

        await api("POST", "/api/carpintero/recuperarpassword", { json: { email: c.email } })
        const actual = db.collection("carpinteros").datos.get(c.id)
        db.collection("carpinteros").datos.set(c.id, { ...actual, tokenExpira: new Date(Date.now() - 1000) })
        assert.equal((await api("GET", `/api/carpintero/recuperarpassword/${actual.token}`)).status, 404)
    })

    test("un carpintero solo edita su propio perfil", async () => {
        const a = await crearCarpintero()
        const b = await crearCarpintero()
        assert.equal((await api("PUT", `/api/carpintero/actualizarperfil/${b.id}`, { token: a.token, json: { nombre: "Hack" } })).status, 403)
        const propio = await api("PUT", `/api/carpintero/actualizarperfil/${a.id}`, { token: a.token, json: { nombre: "Nuevo", rol: "administrador" } })
        assert.equal(propio.status, 200)
        assert.equal(propio.datos.nombre, "Nuevo")
        assert.equal(db.collection("carpinteros").datos.get(a.id).rol, "carpintero")
        assert.equal(propio.datos.password, undefined)
    })
})
