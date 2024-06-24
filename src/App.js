import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import ProductoForm from './components/ProductoForm';
import PedidoForm from './components/PedidoForm';
import ConfirmacionPedido from './components/ConfirmacionPedido';
import ListadoClientes from './components/ListadoClientes';
import ListadoProductos from './components/ListadoProductos';
import ListadoPedidos from './components/ListadoPedidos';
import RegistroCliente from './components/RegistroCliente';
import LoginCliente from './components/LoginCliente';
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
          <Route path="/" element={<HomePage />} />
          <Route path="/producto-form" element={<ProductoForm />} />
          <Route path="/pedido-form" element={<PedidoForm />} />
          <Route path="/confirmacion-pedido" element={<ConfirmacionPedido />} />
          <Route path="/listado-clientes" element={<ListadoClientes />} />
          <Route path="/listado-productos" element={<ListadoProductos />} />
          <Route path="/listado-pedidos" element={<ListadoPedidos />} />
          <Route path="/registro-cliente" element={<RegistroCliente />} />
          <Route path="/login-cliente" element={<LoginCliente />} />
          <Route path="/perfil-cliente" element={<PerfilCliente />} />
          {/* Agregar más rutas según sea necesario */}
        </Routes>
        <Footer />
      </div>
    </Router>
  );
};

// Exporta el componente App para ser utilizado en otros archivos
export default App;
