import PrivateRouteWithRole from './routes/PrivateRouteWithRole'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { Home } from './pages/Home'
import Login from './pages/Login'
import { Register } from './pages/Register'
import { Forgot } from './pages/Forgot'
import { Confirm } from './pages/Confirm'
import { NotFound } from './pages/NotFound'
import Dashboard from './layout/Dashboard'
import Profile from './pages/Profile'
import List from './pages/List'
import Details from './pages/Details'
import Create from './pages/Create'
import Update from './pages/Update'
import Chat from './pages/Chat'
import Reset from './pages/Reset'
import Panel from './pages/Panel'
import ClienteInicio from './pages/ClienteInicio'
import ViewPlane from './pages/ViewPlane'
import Navbar from './components/navbar/Navbar'
import Nosotros from './pages/Nosotros'
import Servicios from './pages/Servicios'
import Contactanos from './pages/Contactanos'
import Finish from './components/navbar/footer'
import { useState, useEffect } from "react";
import PublicRoute from './routes/PublicRoute'
import ProtectedRoute from './routes/ProtectedRoute'
import storeProfile from './context/storeProfile'
import storeAuth from './context/storeAuth'
import { Forbidden } from './pages/Forbidden'
import AdminLogin from './pages/AdminLogin'
import AdminRoute from './routes/AdminRoute'
import AdminPanel from './pages/AdminPanel'
import AdminCarpinteroDetail from './pages/AdminCarpinteroDetail'
import CarpinteroRoute from './routes/CarpinteroRoute'
import CarpinteroCV from './pages/CarpinteroCV'
import PerfilEstado from './pages/PerfilEstado'
import Modelos3D from './pages/Modelos3D'
import ClienteRoute from './routes/ClienteRoute'
import Carpinteros from './pages/cliente/Carpinteros'
import CarpinteroPerfil from './pages/cliente/CarpinteroPerfil'
import Catalogo from './pages/cliente/Catalogo'
import ModeloDetalle from './pages/cliente/ModeloDetalle'
import SolicitarProyecto from './pages/cliente/SolicitarProyecto'
import MisProyectos from './pages/cliente/MisProyectos'

const DashboardInicio = () => {
  const rol = storeAuth((state) => state.rol)
  if (rol === "administrador") return <Navigate to="/dashboard/admin" replace />
  if (rol === "carpintero") return <Navigate to="/dashboard/estado-perfil" replace />
  if (rol === "cliente") return <ClienteInicio />
  return <Panel />
}

function App() {

  const [darkMode, setDarkMode] = useState(false);
  
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const { profile} = storeProfile()
  const { token } = storeAuth()

  useEffect(() => {
    if(token){
      profile()
    }
  }, [token])

  return (
    <>
    <BrowserRouter>
    {!token && <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />}
      <main className={`${!token ? "pt-20" : "pt-0"} min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white transition-colors`}>
      <Routes>
        
        <Route element={<PublicRoute />}>
          <Route path="forbidden" element={<Forbidden />} />
          <Route index element={<Home/>}/>
          <Route path='home' element={<Home/>}/>
          <Route path='admin/login' element={<AdminLogin />} />
          <Route path='login' element={<Login/>}/>
          <Route path='register' element={<Register/>}/>
          <Route path='forgot/:id' element={<Forgot/>}/>
          <Route path='confirm/:token' element={<Confirm/>}/>
          <Route path='reset/:token' element={<Reset/>}/>
          <Route path='viewplane' element={<ViewPlane />} />
          <Route path='/nosotros' element={<Nosotros />} />
          <Route path='/servicios' element={<Servicios />} />
          <Route path='/contactanos' element={<Contactanos />} />
          <Route path='/verPlano' element={<ViewPlane/>}/>
          <Route path='*' element={<NotFound />} />
        </Route>

        <Route path='dashboard/*' element={
            <ProtectedRoute>
              <Routes>
                <Route element={<Dashboard />}>
                  <Route index element={<DashboardInicio />} />
                  <Route path='profile' element={<Profile/>}/>
                  <Route path='list' element={<List/>}/>
                  <Route path='details/:id' element={<Details/>}/>
                  <Route path='create' element={
                    <PrivateRouteWithRole>
                      <Create />
                    </PrivateRouteWithRole>
                  } />
                  <Route path='update/:id' element={
                    <PrivateRouteWithRole>
                      <Update />
                    </PrivateRouteWithRole>
                  } /> 
                  <Route path='chat' element={<Chat/>}/>
                  <Route path='admin' element={<AdminRoute><AdminPanel /></AdminRoute>} />
                  <Route path='admin/carpintero/:id' element={<AdminRoute><AdminCarpinteroDetail /></AdminRoute>} />
                  <Route path='estado-perfil' element={<CarpinteroRoute><PerfilEstado /></CarpinteroRoute>} />
                  <Route path='cv' element={<CarpinteroRoute><CarpinteroCV /></CarpinteroRoute>} />
                  <Route path='modelos3d' element={<CarpinteroRoute><Modelos3D /></CarpinteroRoute>} />
                  <Route path='explorar' element={<ClienteRoute><Carpinteros /></ClienteRoute>} />
                  <Route path='explorar/:id' element={<ClienteRoute><CarpinteroPerfil /></ClienteRoute>} />
                  <Route path='catalogo' element={<ClienteRoute><Catalogo /></ClienteRoute>} />
                  <Route path='catalogo/modelo/:id' element={<ClienteRoute><ModeloDetalle /></ClienteRoute>} />
                  <Route path='solicitar' element={<ClienteRoute><SolicitarProyecto /></ClienteRoute>} />
                  <Route path='mis-proyectos' element={<ClienteRoute><MisProyectos /></ClienteRoute>} />
                </Route>
              </Routes>
            </ProtectedRoute>
            } />


      </Routes>
      </main>
    {!token && <Finish />}

    </BrowserRouter>
    </>
  )
}

export default App
