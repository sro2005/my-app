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
import RecoverPassword from './components/RecoverPassword';

const AppContent = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
      const token = localStorage.getItem('authToken');
      if (token) {
        const userData = JSON.parse(localStorage.getItem('userData'));
        setUser(userData); // Usar los datos del usuario almacenados en localStorage
      }
    }, 1000);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData'); // Remover los datos del usuario de `localStorage`
    setUser(null);
  };

  const handleLoginSuccess = (user) => {
    console.log('Token recibido:', user.token); // Asegúrate de que el token no esté vacío
    setUser(user);
    localStorage.setItem('authToken', user.token);
    localStorage.setItem('userData', JSON.stringify(user)); // Guardar los datos del usuario en localStorage
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <Header isAuthenticated={!!user} onLogout={handleLogout} user={user} />
      <Routes>
        {/* Redirigir automáticamente si el usuario está autenticado */}
        {user && <Route path="/" element={<Navigate to="/home-page" />} />}
        {/* Rutas públicas */}
        {!user ? (
          <>
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<RegistroCliente />} />
            <Route path="/login" element={<LoginCliente onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/recover-password" element={<RecoverPassword />} />
          </>
        ) : (
          <>
            {/* Rutas protegidas para 'user' */}
            {user && (
              <>
                <Route path="/home-page" element={<HomePage user={user} />} />
                <Route path="/pedido-form" element={<PedidoForm user={user} />} />
                <Route path="/listado-productos" element={<ListadoProductos user={user} />} />
                <Route path="/listado-pedidos" element={<ListadoPedidos user={user} />} />
                <Route path="/perfil-cliente" element={<PerfilCliente user={user} />} />
              </>
            )}

            {/* Rutas protegidas para 'admin' */}
            {user && user.role === 'admin' && (
              <>
                <Route path="/producto-form" element={<ProductoForm user={user} />} />
                <Route path="/listado-clientes" element={<ListadoClientes user={user} />} />
              </>
            )}
          </>
        )}

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Footer />
    </>
  );
};

const App = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;
