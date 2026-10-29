import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const HomePage = () => {
  const { user } = useContext(AuthContext);
  const firstName = String(user?.firstName || '').trim().split(/\s+/)[0];
  const preferences = Array.isArray(user?.preferences) ? user.preferences.filter(Boolean).slice(0, 4) : [];

  return (
    <main className="evh-customer-home">
      <section className="evh-customer-hero">
        <div className="evh-customer-hero-copy">
          <span className="evh-eyebrow">TU ESPACIO ELECTROVIBE</span>
          <h1>{firstName ? `Hola, ${firstName}. ¿Qué hacemos más fácil hoy?` : '¿Qué hacemos más fácil en tu hogar hoy?'}</h1>
          <p>No se trata solo de encontrar un electrodoméstico. Cuéntanos qué quieres resolver y explora opciones que tengan sentido para tu hogar.</p>
          <div className="evh-customer-actions">
            <Link className="evh-button evh-button-primary" to="/catalogo">Descubrir productos <span aria-hidden="true">→</span></Link>
            <Link className="evh-button evh-button-secondary" to="/listado-pedidos">Ver mis pedidos</Link>
          </div>
          <div className="evh-customer-trust" aria-label="Información del proceso de pedidos">
            <span><b aria-hidden="true">✓</b> Explora y organiza tus pedidos</span>
            <span><b aria-hidden="true">✓</b> Pago sin procesar al confirmar</span>
            <span><b aria-hidden="true">✓</b> Preferencias bajo tu control</span>
          </div>
        </div>
        <div className="evh-customer-hero-mark" aria-hidden="true">
          <span className="evh-customer-bolt">⚡</span>
          <span className="evh-customer-orbit evh-customer-orbit-a" />
          <span className="evh-customer-orbit evh-customer-orbit-b" />
          <strong>Vive mejor.</strong>
          <small>Elige con intención.</small>
        </div>
      </section>

      <section className="evh-customer-guidance" aria-labelledby="evh-customer-guidance-title">
        <div className="evh-customer-section-heading">
          <span className="evh-eyebrow">MÁS QUE UN CATÁLOGO</span>
          <h2 id="evh-customer-guidance-title">Empieza por lo que necesitas resolver.</h2>
          <p>Encuentra la ruta adecuada para ti: inspiración, recomendaciones o ayuda para organizar tu pedido.</p>
        </div>
        <div className="evh-customer-journey-grid">
          <article className="evh-customer-journey-card">
            <span className="evh-customer-journey-icon" aria-hidden="true">✦</span>
            <span className="evh-customer-step">01 · DESCUBRIR</span>
            <h3>Encuentra tu próxima idea</h3>
            <p>Explora el catálogo y usa filtros para acercarte a lo que buscas.</p>
            <Link to="/catalogo">Explorar catálogo <span aria-hidden="true">→</span></Link>
          </article>
          <article className="evh-customer-journey-card is-featured">
            <span className="evh-customer-journey-icon" aria-hidden="true">◎</span>
            <span className="evh-customer-step">02 · ORIENTARTE</span>
            <h3>Pregunta a la Guía ElectroVibe</h3>
            <p>Describe la tarea, el espacio o la necesidad. La guía te ayudará a revisar opciones del catálogo.</p>
            <Link to="/catalogo">Pedir una recomendación <span aria-hidden="true">→</span></Link>
          </article>
          <article className="evh-customer-journey-card">
            <span className="evh-customer-journey-icon" aria-hidden="true">▤</span>
            <span className="evh-customer-step">03 · TU PEDIDO</span>
            <h3>Revisa antes de confirmar</h3>
            <p>Agrega productos, ajusta las cantidades y revisa los datos de entrega y el total.</p>
            <Link to="/pedido-form">Preparar mi pedido <span aria-hidden="true">→</span></Link>
          </article>
        </div>
      </section>

      <section className="evh-customer-preferences" aria-labelledby="evh-customer-preferences-title">
        <div>
          <span className="evh-eyebrow">HECHO A TU MEDIDA</span>
          <h2 id="evh-customer-preferences-title">Tus intereses, a un solo paso.</h2>
          <p>{preferences.length
            ? 'Tendremos estas categorías presentes al explorar opciones. Puedes cambiar tus preferencias cuando quieras.'
            : 'Guarda tus intereses en el perfil para filtrar con más facilidad. Siempre podrás consultar el catálogo completo.'}</p>
          {preferences.length > 0 && <div className="evh-customer-chips">{preferences.map(preference => <span key={preference}>{preference}</span>)}</div>}
        </div>
        <Link className="evh-button evh-button-secondary" to="/perfil-cliente">Revisar mi perfil</Link>
      </section>
    </main>
  );
};

export default HomePage;
