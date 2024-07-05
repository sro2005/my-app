// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import ProductoForm from './components/ProductoForm';
import PedidoForm from './components/PedidoForm';
import ConfirmacionPedido from './components/ConfirmacionPedido';
import ListadoClientes from './components/ListadoClientes';
import ListadoProductos from './components/ListadoProductos';
import ListadoPedidos from './components/ListadoPedidos';
import PerfilCliente from './components/PerfilCliente';
import RegistroCliente from './components/RegistroCliente';
import LoginCliente from './components/LoginCliente';
import './styles/styles.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <div className="App">
        <Header isAuthenticated={isAuthenticated} onLogout={handleLogout} />
        <Routes>
          {/* Ruta para el formulario de registro */}
          {!isAuthenticated && (
            <Route path="/registro" element={<RegistroCliente />} />
          )}

          {/* Ruta para el formulario de inicio de sesión */}
          {!isAuthenticated && (
            <Route path="/login" element={<LoginCliente onLoginSuccess={handleLoginSuccess} />} />
          )}

          {/* Rutas protegidas que requieren autenticación */}
          {isAuthenticated && (
            <Route path="/" element={<Navigate to="/home-page" />} />
          )}
          {isAuthenticated && (
            <Route path="/home-page" element={<HomePage />} />
          )}
          {isAuthenticated && (
            <Route path="/producto-form" element={<ProductoForm />} />
          )}
          {isAuthenticated && (
            <Route path="/pedido-form" element={<PedidoForm />} />
          )}
          {isAuthenticated && (
            <Route path="/confirmacion-pedido" element={<ConfirmacionPedido />} />
          )}
          {isAuthenticated && (
            <Route path="/listado-clientes" element={<ListadoClientes />} />
          )}
          {isAuthenticated && (
            <Route path="/listado-productos" element={<ListadoProductos />} />
          )}
          {isAuthenticated && (
            <Route path="/listado-pedidos" element={<ListadoPedidos />} />
          )}
          {isAuthenticated && (
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
