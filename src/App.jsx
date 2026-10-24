import React, { useContext } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './contexts/AuthContext';
import Loading from './components/Loading';
import LandingPage from './components/LandingPage';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import AdminDashboard from './components/AdminDashboard';
import AdminInventory from './components/AdminInventory';
import ProductoForm from './components/ProductoForm';
import PedidoForm from './components/PedidoForm';
import ListadoClientes from './components/ListadoClientes';
import ListadoProductos from './components/ListadoProductos';
import ListadoPedidos from './components/ListadoPedidos';
import PerfilCliente from './components/PerfilCliente';
import RegistroCliente from './components/RegistroCliente';
import LoginCliente from './components/LoginCliente';
import RecoverPassword from './components/RecoverPassword';
import ResetPassword from './components/ResetPassword';
import PaymentResult from './components/PaymentResult';
import AboutPage from './components/AboutPage';
import PrivacyPage from './components/PrivacyPage';
import TermsPage from './components/TermsPage';
import RoleGuard from './components/RoleGuard';
import AuthProvider from './contexts/AuthContext';

const AppContent = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <Loading />;

  const isAdmin = user?.role === 'admin';
  const isCustomer = user?.role === 'user';

  return (
    <>
      <Header isAuthenticated={!!user} user={user} />
      <Routes>
        <Route path="/recover-password" element={isAdmin ? <Navigate to="/home-page" replace /> : <RecoverPassword />} />
        <Route path="/reset-password/:token" element={isAdmin ? <Navigate to="/home-page" replace /> : <ResetPassword />} />
        <Route path="/pago-resultado" element={isCustomer ? <PaymentResult /> : <Navigate to={user ? '/home-page' : '/login'} replace />} />
        <Route path="/catalogo" element={isAdmin ? <Navigate to="/home-page" replace /> : <ListadoProductos />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />

        {!user ? (
          <>
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<RegistroCliente />} />
            <Route path="/login" element={<LoginCliente />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Navigate to="/home-page" replace />} />
            <Route path="/home-page" element={isAdmin
              ? <AdminDashboard />
              : <RoleGuard user={user} allowedRole="user"><HomePage /></RoleGuard>} />
            <Route path="/pedido-form" element={
              <RoleGuard user={user} allowedRole="user"><PedidoForm /></RoleGuard>
            } />
            <Route path="/listado-productos" element={isAdmin
              ? <Navigate to="/admin-inventario" replace />
              : <RoleGuard user={user} allowedRole="user"><ListadoProductos /></RoleGuard>} />
            <Route path="/listado-pedidos" element={
              <RoleGuard user={user} allowedRoles={['user', 'admin']}><ListadoPedidos /></RoleGuard>
            } />
            <Route path="/perfil-cliente" element={
              <RoleGuard user={user} allowedRole="user"><PerfilCliente /></RoleGuard>
            } />

            <Route path="/producto-form" element={
              <RoleGuard user={user} allowedRole="admin"><ProductoForm /></RoleGuard>
            } />
            <Route path="/listado-clientes" element={
              <RoleGuard user={user} allowedRole="admin"><ListadoClientes /></RoleGuard>
            } />
            <Route path="/admin-inventario" element={
              <RoleGuard user={user} allowedRole="admin"><AdminInventory /></RoleGuard>
            } />
          </>
        )}
        <Route path="*" element={<Navigate to={user ? '/home-page' : '/'} replace />} />
      </Routes>
      <Footer />
    </>
  );
};

const Router = process.env.REACT_APP_ROUTER_MODE === 'hash' ? HashRouter : BrowserRouter;

const App = () => (
  <Router>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </Router>
);

export default App;
