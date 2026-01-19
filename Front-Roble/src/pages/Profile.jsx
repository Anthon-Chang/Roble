import { useEffect } from 'react'
import CardPassword from '../components/profile/CardPassword'
import { CardProfile } from '../components/profile/CardProfile'
import { CardProfileOwner } from '../components/profile/CardProfileOwner'
import FormProfile from '../components/profile/FormProfile'
import storeProfile from '../context/storeProfile'

const Profile = () => {
  const { user, profile } = storeProfile()

  useEffect(() => {
    profile()
  }, [])

  return (
    <>
      <div>
        <h1 className="font-black text-4xl text-gray-500">Perfil</h1>
        <hr className="my-4 border-gray-300" />
        <p className="mb-8">
          Este módulo te permite gestionar el perfil del usuario
        </p>
      </div>

      {user?.rol === 'cliente' ? (
        <CardProfileOwner />
      ) : (
        <>
          <div className="flex justify-around gap-x-8 flex-wrap gap-y-8 md:flex-nowrap">
            <div className="w-full md:w-1/2">
              <CardProfile />
            </div>
          </div>

          <div className="flex justify-around gap-x-8 flex-wrap gap-y-8 md:flex-nowrap">
            <div className="w-full md:w-11/12 flex flex-col md:flex-row gap-x-8 mx-auto justify-center items-center">
              <div className="w-full md:w-5/12">
                <FormProfile />
              </div>

              <div className="w-full md:w-5/12">
                <CardPassword />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default Profile
