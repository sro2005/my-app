import React, { lazy, Suspense, useContext, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import { BrowserRouter, HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from './contexts/AuthContext';
import Loading from './components/Loading';
import Header from './components/Header';
import Footer from './components/Footer';
import RoleGuard from './components/RoleGuard';
import AuthProvider from './contexts/AuthContext';

// Load each screen only when its route is opened to keep the initial bundle small.
const HomePage = lazy(() => import('./components/HomePage'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const AdminInventory = lazy(() => import('./components/AdminInventory'));
const ProductoForm = lazy(() => import('./components/ProductoForm'));
const PedidoForm = lazy(() => import('./components/PedidoForm'));
const ListadoClientes = lazy(() => import('./components/ListadoClientes'));
const ListadoProductos = lazy(() => import('./components/ListadoProductos'));
const ListadoPedidos = lazy(() => import('./components/ListadoPedidos'));
const PerfilCliente = lazy(() => import('./components/PerfilCliente'));
const ChangePassword = lazy(() => import('./components/ChangePassword'));
const RegistroCliente = lazy(() => import('./components/RegistroCliente'));
const LoginCliente = lazy(() => import('./components/LoginCliente'));
const RecoverPassword = lazy(() => import('./components/RecoverPassword'));
const ResetPassword = lazy(() => import('./components/ResetPassword'));
const AboutPage = lazy(() => import('./components/AboutPage'));
const PrivacyPage = lazy(() => import('./components/PrivacyPage'));
const TermsPage = lazy(() => import('./components/TermsPage'));

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    root.style.scrollBehavior = previousBehavior;
  }, [pathname]);

  return null;
};

const AppContent = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <Loading />;

  const isAdmin = user?.role === 'admin';

  return (
    <>
      <Header isAuthenticated={!!user} user={user} />
      <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/recover-password" element={isAdmin ? <Navigate to="/home-page" replace /> : <RecoverPassword />} />
        <Route path="/reset-password/:token" element={isAdmin ? <Navigate to="/home-page" replace /> : <ResetPassword />} />
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
            <Route path="/seguridad" element={
              <RoleGuard user={user} allowedRoles={['user', 'admin']}><ChangePassword /></RoleGuard>
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
      </Suspense>
      <Footer />
    </>
  );
};

const Router = process.env.REACT_APP_ROUTER_MODE === 'hash' ? HashRouter : BrowserRouter;

const App = () => {
  // Older recovery emails used a pathname URL. Convert it to the hash route
  // expected by the static frontend, provided the host serves the SPA shell.
  if (process.env.REACT_APP_ROUTER_MODE === 'hash' &&
      typeof window !== 'undefined' &&
      !window.location.hash) {
    const legacyResetPath = /^\/reset-password\/([a-f0-9]{64})\/?$/i.exec(window.location.pathname);
    if (legacyResetPath) {
      window.location.replace(`${window.location.origin}/#/reset-password/${legacyResetPath[1]}`);
      return null;
    }
  }

  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
