import PrivateRouteWithRole from './routes/PrivateRouteWithRole'
import { BrowserRouter, Route, Routes } from 'react-router'
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
                <Route index element={
                    <PrivateRouteWithRole>
                      <Panel />
                    </PrivateRouteWithRole>
                  } />
                  <Route index element={<Panel/>}/>
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
