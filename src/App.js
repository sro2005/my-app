// src/App.js
import React from 'react';
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
  const { user, logout, loading } = useUser();

  if (loading) {
    return <Loading />;
  }

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <Header isAuthenticated={!!user} onLogout={handleLogout} />
      <Routes>
        {!user ? (
          <>
            <Route path="/" element={<LandingPage />} />
            <Route path="/registro" element={<RegistroCliente />} />
            <Route path="/login" element={<LoginCliente />} />
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
  <UserProvider>
    <Router>
      <AppContent />
    </Router>
  </UserProvider>
);

export default App;

