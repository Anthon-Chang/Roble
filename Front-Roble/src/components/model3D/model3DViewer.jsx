import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export default function ThreeViewer({ modelUrl }) {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!modelUrl) return; // ⬅️ No hay modelo, no renderizar

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
    controls.update();

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
      },
      undefined,
      (error) => console.error("Error cargando GLB:", error)
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

  return (
    <div
      ref={mountRef}
      style={{ width: "100%", height: "500px", backgroundColor: "#eee" }}
    ></div>
  );
}

