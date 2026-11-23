import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const FACTOR_ACERCAR = 0.85;
const FACTOR_ALEJAR = 1.18;

export default function ThreeViewer({ modelUrl }) {
  const mountRef = useRef(null);
  const wrapperRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const vistaInicialRef = useRef(null); // { posicion, objetivo }

  const [dimensiones, setDimensiones] = useState(null); // { ancho, alto, profundo } en cm
  const [cargando, setCargando] = useState(true);
  const [mostrarAyuda, setMostrarAyuda] = useState(true);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);

  useEffect(() => {
    if (!modelUrl) return; // ⬅️ No hay modelo, no renderizar

    setCargando(true);
    setDimensiones(null);

    const mount = mountRef.current;

    // --- CLEAN PREVIOUS SCENE ---
    mount.innerHTML = ""; // Evitar escenas duplicadas

    // --- SCENE ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeeeeee);

    const camera = new THREE.PerspectiveCamera(
      75,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );

    camera.position.set(2, 2, 4);
    cameraRef.current = camera;

    // --- RENDERER ---
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.physicallyCorrectLights = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    mount.appendChild(renderer.domElement);

    // --- CONTROLS ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1, 0);
    controls.minDistance = 0.3;
    controls.maxDistance = 50;
    controls.update();
    controlsRef.current = controls;

    // --- LIGHTS ---
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1);
    fillLight.position.set(-5, -5, -5);
    scene.add(fillLight);

    // --- LOAD SELECTED MODEL ---
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;

        model.traverse((child) => {
          if (child.isMesh && child.material) child.material.needsUpdate = true;
        });

        model.scale.set(1, 1, 1);
        scene.add(model);

        // --- MEDIDAS REALES DEL MODELO (glTF usa metros como unidad estándar) ---
        const caja = new THREE.Box3().setFromObject(model);
        const tamano = new THREE.Vector3();
        caja.getSize(tamano);
        setDimensiones({
          ancho: Math.round(tamano.x * 100),
          alto: Math.round(tamano.y * 100),
          profundo: Math.round(tamano.z * 100),
        });

        // --- ENCUADRAR LA CÁMARA SEGÚN EL TAMAÑO REAL ---
        const centro = new THREE.Vector3();
        caja.getCenter(centro);
        const radio = Math.max(tamano.x, tamano.y, tamano.z, 0.1);
        camera.position.set(centro.x + radio, centro.y + radio * 0.8, centro.z + radio * 1.4);
        controls.target.copy(centro);
        controls.update();

        vistaInicialRef.current = {
          posicion: camera.position.clone(),
          objetivo: centro.clone(),
        };

        setCargando(false);
      },
      undefined,
      (error) => {
        console.error("Error cargando GLB:", error);
        setCargando(false);
      }
    );

    // --- ANIMATION ---
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // --- RESIZE ---
    const handleResize = () => {
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
    };

    window.addEventListener("resize", handleResize);

    // --- CLEANUP ---
    return () => {
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      window.removeEventListener("resize", handleResize);
    };
  }, [modelUrl]); // ⬅️ Renderiza cada vez que la URL cambie

  // Mantiene sincronizado el estado de pantalla completa con el navegador
  // (por si el usuario sale con Esc en vez de con el botón)
  useEffect(() => {
    const alCambiarPantallaCompleta = () => setPantallaCompleta(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", alCambiarPantallaCompleta);
    return () => document.removeEventListener("fullscreenchange", alCambiarPantallaCompleta);
  }, []);

  const acercarOAlejar = (factor) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    const direccion = new THREE.Vector3().subVectors(camera.position, controls.target);
    direccion.multiplyScalar(factor);
    const nuevaDistancia = direccion.length();
    if (nuevaDistancia < controls.minDistance || nuevaDistancia > controls.maxDistance) return;
    camera.position.copy(controls.target).add(direccion);
    controls.update();
  };

  const restablecerVista = () => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const inicial = vistaInicialRef.current;
    if (!camera || !controls || !inicial) return;
    camera.position.copy(inicial.posicion);
    controls.target.copy(inicial.objetivo);
    controls.update();
  };

  const alternarPantallaCompleta = () => {
    const el = wrapperRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const btnCls =
    "w-9 h-9 flex items-center justify-center rounded-full bg-white/90 shadow text-gray-700 hover:bg-amber-100 hover:text-amber-800 transition text-lg font-bold select-none";

  return (
    <div
      ref={wrapperRef}
      className="relative"
      style={{ width: "100%", height: pantallaCompleta ? "100vh" : "500px", backgroundColor: "#eee" }}
    >
      <div ref={mountRef} style={{ width: "100%", height: "100%" }}></div>

      {cargando && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#eee]/80 text-sm text-gray-500">
          Cargando modelo 3D...
        </div>
      )}

      {/* Controles de zoom / vista, siempre visibles mientras hay un modelo cargado */}
      {!cargando && (
        <div className="absolute bottom-3 right-3 flex flex-col gap-2">
          <button type="button" onClick={() => acercarOAlejar(FACTOR_ACERCAR)} className={btnCls} title="Acercar (zoom +)">
            +
          </button>
          <button type="button" onClick={() => acercarOAlejar(FACTOR_ALEJAR)} className={btnCls} title="Alejar (zoom -)">
            −
          </button>
          <button type="button" onClick={restablecerVista} className={btnCls} title="Restablecer vista">
            ⟲
          </button>
          <button
            type="button"
            onClick={alternarPantallaCompleta}
            className={btnCls}
            title={pantallaCompleta ? "Salir de pantalla completa" : "Ver en pantalla completa"}
          >
            {pantallaCompleta ? "⤡" : "⤢"}
          </button>
        </div>
      )}

      {/* Medidas aproximadas, visibles por defecto en cuanto carga el modelo */}
      {dimensiones && (
        <div className="absolute bottom-3 left-3 rounded-lg bg-white/90 px-3 py-2 text-xs text-gray-700 shadow">
          <p className="mb-0.5 font-semibold text-amber-800">📐 Medidas aproximadas</p>
          <p>Ancho: {dimensiones.ancho} cm</p>
          <p>Alto: {dimensiones.alto} cm</p>
          <p>Profundidad: {dimensiones.profundo} cm</p>
        </div>
      )}

      {/* Ayuda interactiva: panel con instrucciones, se puede cerrar y volver a abrir */}
      {mostrarAyuda ? (
        <div className="absolute top-3 left-3 right-3 max-w-xs rounded-lg bg-white/95 p-3 text-xs text-gray-700 shadow-lg sm:right-auto">
          <div className="mb-1 flex items-start justify-between gap-2">
            <p className="font-semibold text-amber-800">¿Cómo ver el modelo?</p>
            <button
              type="button"
              onClick={() => setMostrarAyuda(false)}
              className="leading-none text-gray-400 hover:text-gray-700"
              title="Cerrar ayuda"
            >
              ✕
            </button>
          </div>
          <ul className="space-y-1">
            <li>🖱️ Clic izquierdo y arrastra para rotar</li>
            <li>🖐️ Clic derecho (o dos dedos) y arrastra para mover</li>
            <li>🔍 Rueda del mouse o botones +/− para acercar</li>
            <li>⟲ Restablece la vista cuando quieras</li>
            <li>⤢ Ábrelo en pantalla completa</li>
          </ul>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setMostrarAyuda(true)}
          className={`absolute top-3 left-3 ${btnCls}`}
          title="Mostrar ayuda"
        >
          ?
        </button>
      )}
    </div>
  );
}
