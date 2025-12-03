import { FaFacebook } from "react-icons/fa";
import { FaSquareInstagram } from "react-icons/fa6";
import { FaXTwitter } from "react-icons/fa6";
import contac from '../assets/contacto.webp'

const Contactanos = () => {
  return (
    <footer id="contactanos" className="bg-[#fff7ed] dark:bg-[#1e2939] p-8 sm:p-16 space-y-10">
      <h2 className="text-4xl font-extrabold text-amber-800 text-left mb-1">Contáctanos</h2>
      <span className="block h-1 w-24 bg-amber-900 mx-15 mt-2 rounded-full"></span>

      <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-20">
        <img 
            src={contac}
            alt="contacto"
            className="w-full max-w-md lg:max-w-xl h-auto object-contain"
        />

        <form className="w-full max-w-lg bg-white dark:bg-[#1a222e] p-6 rounded-lg shadow-md">
            <fieldset className="space-y-4">
                <legend className="text-xl font-semibold text-amber-800 dark:text-amber-400">
                Para más información
                </legend>

                <input
                type="text"
                placeholder="Nombre"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />

                <input
                type="text"
                placeholder="Apellido"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />

                <input
                type="email"
                placeholder="Correo"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />

                <textarea
                placeholder="Escribe tu mensaje"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-4 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                ></textarea>

                <button
                type="submit"
                className="w-full bg-amber-950 dark:bg-amber-700 text-white py-2 rounded-md hover:bg-amber-800 dark:hover:bg-amber-600 transition-colors"
                >
                Enviar
                </button>
            </fieldset>
            </form>
      </div>

      <div className="text-center space-y-4">
        <p className="text-2xl font-bold text-amber-800">Redes Sociales</p>
        <div className="flex justify-center gap-6 text-amber-800 text-2xl">
          <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer"><FaFacebook /></a>
          <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer"><FaSquareInstagram /></a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><FaXTwitter /></a>
        </div>
      </div>
    </footer>
  );
};

export default Contactanos;
