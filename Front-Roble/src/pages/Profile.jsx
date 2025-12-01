
import CardPassword from '../components/profile/CardPassword'
import { CardProfile } from '../components/profile/CardProfile'
import FormProfile from '../components/profile/FormProfile'


const Profile = () => {
    return (
        <>       
            <div>
                <h1 className='font-black text-4xl text-gray-500'>Perfil</h1>
                <hr className='x'/>
                <p className='mb-8'>Este módulo te permite gestionar el perfil del usuario</p>
            </div>


            <div className='flex justify-around gap-x-8 flex-wrap gap-y-8 md:flex-nowrap'>

                {/* Card para mostrar el perfil y formulario para cambiar la contraseña */}
                <div className='w-full md:w-1/2'>
                    <CardProfile/>
                </div>
            </div>
            <div className='flex justify-around gap-x-8 flex-wrap gap-y-8 md:flex-nowrap'>

            {/* Contenedor principal */}
            <div className='w-full md:w-11/12 flex flex-col md:flex-row gap-x-8 mx-auto justify-center items-center'>
                {/* Formulario perfil */}
                <div className='w-full md:w-5/12'>
                <FormProfile/>
                </div>
                {/* Card contraseña */}
                <div className='w-full md:w-5/12'>
                <CardPassword/>
                </div>
            </div>
            </div>
        </>

    )
}

export default Profile