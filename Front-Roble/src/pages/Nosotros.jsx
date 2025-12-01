import NS from '../assets/Nosotros.jpg'
import { RxDashboard } from "react-icons/rx";
import { BsCashCoin } from "react-icons/bs";
import { SiMaterialformkdocs } from "react-icons/si";

import { TbBadge3DFilled } from "react-icons/tb";
import { GrUserWorker } from "react-icons/gr";
import { IoIosPeople } from "react-icons/io";

const Nosotros = () => {
return (
<section id="nosotros" className='container mx-auto px-4'>
                <div className='container mx-auto relative mt-6'>
                    <h2 className='font-semibold text-3xl relative z-1 w-50 text-center mx-auto bg-auto pt-10'>Nosotros</h2>
                    <div className='text-amber-900 border-2 absolute top-1/2 w-full z-0 pt-10' />
                </div>
                <div className='my-10 flex flex-col gap-10 items-center sm:flex-row sm:justify-around sm:items-center'>

                    <div className='sm:w-1/2'>
                        <img src={NS} alt="mueble" className='w-120 h-120 object-cover' />
                    </div>

                    <div className='px-10 sm:w-1/2'>
                        <p className='my-4'>Roble es un espacio donde la arquitectura digital y los modelos 3D se encuentran con el diseño de interiores para crear soluciones sorprendentes.
                        </p>
                        <ul className='space-y-4'>
                            <li>
                                <RxDashboard className='inline text-2xl mr-2' />Administrador de cuenta
                            </li>
                            <li>
                                <TbBadge3DFilled className='inline text-2xl mr-2' />Modelado 3D
                            </li>
                            <li>
                                <BsCashCoin className='inline text-2xl mr-2' />
                                Pago agil
                            </li>
                            <li>
                                <IoIosPeople className='inline text-2xl mr-2' />
                                gestion de clientes
                            </li>
                            <li>
                                <GrUserWorker  className='inline text-2xl mr-2' />
                                gestion de Diseñadores y mano de obra
                            </li>
                            <li>
                                <SiMaterialformkdocs  className='inline text-2xl mr-2' />
                                Gestion de materiales 
                            </li>
                        </ul>
                        <p className='my-4'></p>
                    </div>
                </div>
            </section>


    );
};

export default Nosotros;
