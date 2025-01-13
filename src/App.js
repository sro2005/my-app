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

const AppContent = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
      const token = localStorage.getItem('authToken');
      if (token) {
        setUser({ email: 'test@example.com' }); // Simulación de usuario autenticado
      }
    }, 1000);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  const handleLoginSuccess = () => {
    setUser({ email: 'test@example.com' });
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <Header isAuthenticated={!!user} onLogout={handleLogout} />
      <Routes>
        {!user ? (
          <>
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<RegistroCliente />} />
            <Route path="/login" element={<LoginCliente onLoginSuccess={handleLoginSuccess} />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Navigate to="/home-page" />} />
            <Route path="/home-page" element={<HomePage />} />
            <Route path="/producto-form" element={<ProductoForm />} />
            <Route path="/pedido-form" element={<PedidoForm />} />
            <Route path="/listado-clientes" element={<ListadoClientes />} />
            <Route path="/listado-productos" element={<ListadoProductos />} />
            <Route path="/listado-pedidos" element={<ListadoPedidos />} />
            <Route path="/perfil-cliente" element={<PerfilCliente />} />
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
