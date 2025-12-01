import { FaFacebook } from "react-icons/fa";
import { FaSquareInstagram } from "react-icons/fa6";
import { FaXTwitter } from "react-icons/fa6";

const Contactanos = () => {
return (
    <footer id="Contactanos" className='text-center bg-[#fff7ed] dark:bg-[#1e2939] p-6 sm:px-20 sm:py-10 mt-20 space-y-1'>
    
        <div className='flex flex-col items-center'>
            <div className='text-5xl font-extrabold text-amber-800'>Contactanos</div>
        </div>

        <div className='flex justify-between items-center'>
            <img 
                src="/src/assets/contacto.png"
                alt="contacto" 
                className="w-150 h-150 object-contain"
            />
    
            <div className='flex-1 sm:max-w-1/2'>
                <form action="#" className='w-full p-4'>
                    <fieldset className='border-2 border-amber-900 p-4 rounded-sm '>
                        <legend className='bg-amber-950 w-full text-left text-white pl-2 py-2'>para mas informacion</legend>
                        <div className='flex flex-col justify-between gap-4'>
                            <input type="name" placeholder="Ingrese su nombre" className='sm:flex-1 border border-gray-300 rounded-md focus:outline-none px-2' />
                            <input type="lastname" placeholder="Ingrese su apellido" className='sm:flex-1 border border-gray-300 rounded-md focus:outline-none px-2' />
                            <input type="email" placeholder="Ingrese su correo" className='sm:flex-1 border border-gray-300 rounded-md focus:outline-none px-2' />
                            <input type="message" placeholder="escriba su mensaje" className='sm:flex-1 border border-gray-300 rounded-md focus:tline-none px-2 py-10' />
                            <button className='flex-1 sm:max-w-40 border bg-amber-950 p-1 rounded-lg text-white'>enviar</button>
                        </div>
                    </fieldset>
                </form>
            </div>
        </div>
        <div className="flex flex-col items-left gap-4">
            <p className="text-3xl font-extrabold text-amber-800 text-left">Redes Sociales</p>

            <ul className="flex gap-6">
                <li><a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer"><FaFacebook className="text-2xl" /></a></li>
                <li><a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer"><FaSquareInstagram className="text-2xl" /></a></li>
                <li><a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><FaXTwitter className="text-2xl" /></a></li>
            </ul>
        </div>
    </footer>
  );
};

export default Contactanos;
