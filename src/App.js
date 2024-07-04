// App.js

import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer'; // Importa el componente Footer
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import ProductoForm from './components/ProductoForm';
import PedidoForm from './components/PedidoForm';
import ConfirmacionPedido from './components/ConfirmacionPedido';
import ListadoClientes from './components/ListadoClientes';
import ListadoProductos from './components/ListadoProductos';
import ListadoPedidos from './components/ListadoPedidos';
import PerfilCliente from './components/PerfilCliente';
import './styles/styles.css';

// Componente principal de la aplicación
const App = () => {
  return (
    <Router>
      <div className="App">
        {/* Encabezado de la aplicación */}
        <Header />
        
        {/* Definición de las rutas de la aplicación */}
        <Routes>
          {/* Ruta de registro e inicio de sesión */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas de la aplicación principal */}
          <Route path="/home-page" element={<HomePage />} />
          <Route path="/producto-form" element={<ProductoForm />} />
          <Route path="/pedido-form" element={<PedidoForm />} />
          <Route path="/confirmacion-pedido" element={<ConfirmacionPedido />} />
          <Route path="/listado-clientes" element={<ListadoClientes />} />
          <Route path="/listado-productos" element={<ListadoProductos />} />
          <Route path="/listado-pedidos" element={<ListadoPedidos />} />
          <Route path="/perfil-cliente" element={<PerfilCliente />} />

          {/* Agregar más rutas según sea necesario */}
        </Routes>
        
        {/* Footer de la aplicación */}
        <Footer />
      </div>
    </Router>
  );
};

export default App;
