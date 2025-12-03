    import { useState, useEffect } from "react";
    import AppStoreImage from '../assets/appstore.png';
    import GooglePlayImage from '../assets/googleplay.png';
    import { Link } from 'react-router';
    import m1 from '../assets/muebles/mueble1.webp';
    import m2 from '../assets/muebles/mueble2.webp';
    import m3 from '../assets/muebles/mueble3.webp';
    import m4 from '../assets/muebles/mueble4.webp';
    import m5 from '../assets/muebles/mueble5.webp';

    export const Home = () => {
    const imagenes = [m1, m2, m3, m4, m5];
    const [indiceActual, setIndiceActual] = useState(0);

    // Cambiar imagen automáticamente cada 3 segundos
    useEffect(() => {
        const interval = setInterval(() => {
        setIndiceActual((prev) => (prev + 1) % imagenes.length);
        }, 3000); // 3000 ms = 3 segundos

        // Limpiar el intervalo al desmontar el componente
        return () => clearInterval(interval);
    }, []);

    return (
        <>
        <main className='text-center py-6 px-8 bg-[#fff7ed] dark:bg-[#1e2939] md:text-left md:flex justify-between items-start gap-10 md:py-30 md:px-20 lg:px-32'>
            <div className="flex-1">
            <h1 className='font-lato font-extrabold text-amber-800 uppercase text-4xl my-4 md:text-6xl'>
                Explora Nuestros Planos de Interiores
            </h1>

            <p className='font-bold text-left my-8 md:text-3xl'>
                Visualiza diseños reales creados con modelado 3D y arquitectura digital.
            </p>

            <p className='text-2xl my-6 font-sans'>Modelo 3D, explora y más ...</p>

            <Link
                to="/viewPlane"
                className='block bg-[#f59e0b] w-40 py-2 mx-auto text-white rounded-2xl text-center sm:mx-0 hover:bg-amber-700'
            >
                ver diseños
            </Link>

            <p className='font-bold text-left my-4 md:text-2xl'>Descarga nuestra App:</p>

            <div className="flex justify-center gap-15 py-15">
                <a
                href="https://apps.apple.com/app"
                target="_blank"
                rel="noopener noreferrer"
                >
                <img src={AppStoreImage} alt="App Store" className="h-15" />
                </a>

                <a
                href="https://play.google.com/store/apps"
                target="_blank"
                rel="noopener noreferrer"
                >
                <img src={GooglePlayImage} alt="Google Play" className="h-15" />
                </a>
            </div>
            </div>

            {/* Contenedor de la imagen única (carrusel automático) */}
            <div className="relative flex-1 h-152 flex items-center justify-center overflow-hidden bg-[#fff7ed] dark:bg-[#1e2939] rounded-lg">
            <img
                src={imagenes[indiceActual]}
                alt={`mueble${indiceActual + 1}`}
                className="w-full h-full object-contain transition-transform duration-500"
            />
            </div>
        </main>
        </>
    );
    };
