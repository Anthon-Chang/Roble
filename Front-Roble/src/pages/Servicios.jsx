import { SiMaterialformkdocs } from "react-icons/si";
import { IoChatbubbleEllipsesSharp } from "react-icons/io5";
import { GrUserWorker } from "react-icons/gr";
import { IoIosPeople } from "react-icons/io";

const Servicios = () => {
  return (
    <section className='container mx-auto px-4'>
    
                    <div id="servicios" className='container mx-auto relative mt-6'>
                        <h2 className='font-semibold text-3xl relative z-1 w-50 text-center mx-auto bg-auto pt-10'>SERVICIOS</h2>
                        <div className='text-amber-900 border-2 absolute top-1/2 w-full z-0 pt-10' />
                    </div>
    
                    <div className='py-25 my-10 flex flex-coljustify-between flex-wrap gap-5'>
    
                        <div className="text-center shadow-[0.1rem_0.1rem_1rem_rgba(0,0,0,0.3)] hover:shadow-[0.1rem_0.1rem_1rem_rgba(0,0,0,0.5)] transition-shadow duration-300 relative pt-4 sm:flex-1">
                            <GrUserWorker  className='inline text-5xl' />
                            <h4 className="text-xl font-bold py-4 text-amber-700 hover:underline">Gestion de Carpinteros
                            </h4>
                            <p className="my-4 px-2">Nuestros profecionales dispondran de espacios de publicación de sus trabajos,
                                ademas de integrar su numero de contacto o chatear por medio de nuestra aplicaión.</p>
                            <hr className="border-1 border-amber-900 absolute w-full" />
                        </div>
    
    
                        <div className="text-center shadow-[0.1rem_0.1rem_1rem_rgba(0,0,0,0.3)] hover:shadow-[0.1rem_0.1rem_1rem_rgba(0,0,0,0.5)] transition-shadow duration-300 relative pt-4 sm:flex-1">
                            <IoIosPeople className='inline text-5xl' />
                            <h4 className="text-xl font-bold py-4 text-amber-700 hover:underline">Gestion de clientes</h4>
                            <p className="my-4 px-2">Podras ver y gestionar los productos que van con la mano de obra de cada uno
                                de nuestros porfecionales en la carpinteria, ademas de solicitar el contacto personal..</p>
                            <hr className="border-1 border-amber-900 absolute w-full" />
                        </div>
    
                        <div className="text-center shadow-[0.1rem_0.1rem_1rem_rgba(0,0,0,0.3)] hover:shadow-[0.1rem_0.1rem_1rem_rgba(0,0,0,0.5)] transition-shadow duration-300 relative pt-4 sm:flex-1">
                            <SiMaterialformkdocs  className='inline text-5xl' />
                            <h4 className="text-xl font-bold py-4 text-amber-700 hover:underline">Gestion de materiales</h4>
                            <p className="my-4 px-2">Quedarn en acuerdo mutuo con nuestros profecionales para escoger el mejor material
                                que se decea fabricar sus muebles y lo que mejor le combenga para cada caso.</p>
                            <hr className="border-1 border-amber-900 absolute w-full" />
                        </div>
    
                        <div className="text-center shadow-[0.1rem_0.1rem_1rem_rgba(0,0,0,0.3)] hover:shadow-[0.1rem_0.1rem_1rem_rgba(0,0,0,0.5)] transition-shadow duration-300 relative pt-4 sm:flex-1">
                            < IoChatbubbleEllipsesSharp className='inline text-5xl' />
                            <h4 className="text-xl font-bold py-4 text-amber-700 hover:underline">Chatea en tiempo real</h4>
                            <p className="my-4 px-2">Puede comunicarse por medio de nuestro chat que le brinda nuestra aplicacion
                                para que pueda tener una mejor comunicacion con nuestros profecionales.</p>
                            <hr className="border-1 border-amber-900 absolute w-full" />
                        </div>
                    </div>
                </section>
  );
};

export default Servicios;
