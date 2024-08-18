// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Loading from './components/Loading'; 
import LandingPage from './components/LandingPage';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import ProductoForm from './components/ProductoForm';
import PedidoForm from './components/PedidoForm';
import ListadoClientes from './components/ListadoClientes';
import ListadoProductos from './components/ListadoProductos';
import ListadoPedidos from './components/ListadoPedidos';
import PerfilCliente from './components/PerfilCliente';
import RegistroCliente from './components/RegistroCliente';
import LoginCliente from './components/LoginCliente';
import './styles/styles.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [userRole, setUserRole] = useState(null); // Nuevo estado para el rol

  useEffect(() => {
    // Simula una llamada a un API o verificación de token
    const checkAuthentication = async () => {
      try {
        // Simula un retraso para la verificación
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const token = localStorage.getItem('authToken');
        const role = localStorage.getItem('userRole'); // Obtener el rol del localStorage
        setIsAuthenticated(!!token);
        setUserRole(role); // Establecer el rol
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsAuthenticated(false);
      }
    };

    checkAuthentication();
  }, []);

  const handleLoginSuccess = (role) => {
    setIsAuthenticated(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole'); // Eliminar el rol del localStorage
    setIsAuthenticated(false);
    setUserRole(null);
  };

  if (isAuthenticated === null) {
    // Muestra el componente de carga mientras se verifica la autenticación
    return <Loading />;
  }

  return (
    <Router>
      <div className="App">
        <Header isAuthenticated={isAuthenticated} onLogout={handleLogout} />
        <Routes>
          {!isAuthenticated && (
            <Route path="/" element={<LandingPage />} />
          )}

          {/* Ruta para el formulario de registro */}
          {!isAuthenticated && (
            <Route path="/registro" element={<RegistroCliente />} />
          )}

          {/* Ruta para el formulario de inicio de sesión */}
          {!isAuthenticated && (
            <Route path="/login" element={<LoginCliente onLoginSuccess={handleLoginSuccess} />} />
          )}

          {/* Rutas protegidas que requieren autenticación */}
          {isAuthenticated && userRole === 'cliente' && (
            <Route path="/" element={<Navigate to="/home-page" />} />
          )}
          {isAuthenticated && userRole === 'cliente' && (
            <Route path="/home-page" element={<HomePage />} />
          )}
          {isAuthenticated && userRole === 'cliente' && (
            <Route path="/listado-productos" element={<ListadoProductos />} />
          )}
          {isAuthenticated && userRole === 'cliente' && (
            <Route path="/listado-pedidos" element={<ListadoPedidos />} />
          )}
          {isAuthenticated && userRole === 'cliente' && (
            <Route path="/perfil-cliente" element={<PerfilCliente />} />
          )}


          {isAuthenticated && userRole === 'admin' && (
            <Route path="/" element={<Navigate to="/home-page" />} />
          )}
          {isAuthenticated && userRole === 'admin' && (
            <Route path="/home-page" element={<HomePage />} />
          )}
          {isAuthenticated && userRole === 'admin' && (
            <Route path="/producto-form" element={<ProductoForm />} />
          )}
          {isAuthenticated && userRole === 'admin' && (
            <Route path="/pedido-form" element={<PedidoForm />} />
          )}
          {isAuthenticated && userRole === 'admin' && (
            <Route path="/listado-clientes" element={<ListadoClientes />} />
          )}
          {isAuthenticated && userRole === 'admin' && (
            <Route path="/listado-productos" element={<ListadoProductos />} />
          )}
          {isAuthenticated && userRole === 'admin' && (
            <Route path="/listado-pedidos" element={<ListadoPedidos />} />
          )}
          {isAuthenticated && userRole === 'admin' && (
            <Route path="/perfil-cliente" element={<PerfilCliente />} />
          )}


          {/* Ruta de redirección por defecto */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
