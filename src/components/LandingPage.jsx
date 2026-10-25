import React from 'react';
import { Link } from 'react-router-dom';

const categories = [
  { icon: '🧊', name: 'Refrigeración', detail: 'Conserva tus alimentos frescos' },
  { icon: '🧺', name: 'Lavado y cuidado', detail: 'Más tiempo para lo importante' },
  { icon: '🍳', name: 'Cocina', detail: 'Ideas para cada receta' },
  { icon: '🧹', name: 'Limpieza del hogar', detail: 'Tu casa, más fácil de cuidar' }
];

const LandingPage = () => (
  <main className="evh-landing">
    <section className="evh-hero">
      <div className="evh-hero-copy">
        <span className="evh-eyebrow evh-hero-tagline">ELECTRODOMÉSTICOS Y TECNOLOGÍA PARA TU HOGAR</span>
        <h1>Encuentra tecnología que haga <span>más fácil tu día a día.</span></h1>
        <p>Explora electrodomésticos y tecnología para el hogar, compara categorías y descubre opciones según el espacio y las tareas de tu rutina.</p>
        <div className="evh-hero-actions">
          <Link className="evh-button evh-button-primary" to="/catalogo">Explorar productos <span aria-hidden="true">→</span></Link>
          <Link className="evh-button evh-button-secondary" to="/register">Crear mi cuenta</Link>
        </div>
        <div className="evh-trust-row">
          <span><strong aria-hidden="true">✓</strong> Categorías fáciles de explorar</span>
          <span><strong aria-hidden="true">✓</strong> Tus preferencias en un solo lugar</span>
          <span><strong aria-hidden="true">✓</strong> Pedidos de prueba, sin cobros reales</span>
        </div>
      </div>
      <div className="evh-hero-art evh-smart-home-illustration" aria-label="Ilustración ordenada de una nevera, un televisor y una lavadora para el hogar" role="img">
        <div className="evh-scene-halo" />
        <div className="evh-scene-showcase">
          <div className="evh-scene-appliance evh-scene-fridge">
            <span className="evh-fridge-badge" aria-hidden="true">❄</span>
            <i className="evh-fridge-seam" />
            <b className="evh-fridge-handle evh-fridge-handle-one" />
            <b className="evh-fridge-handle evh-fridge-handle-two" />
          </div>
          <div className="evh-scene-tv">
            <div className="evh-tv-screen"><span aria-hidden="true">⌁</span></div>
            <i className="evh-tv-stand" />
          </div>
          <div className="evh-scene-appliance evh-scene-washer">
            <span className="evh-washer-controls"><i /></span>
            <i className="evh-washer-door" />
          </div>
        </div>
        <div className="evh-scene-platform" />
        <div className="evh-art-label">Tecnología pensada para casa.</div>
      </div>
    </section>

    <section className="evh-categories">
      <div className="evh-section-heading">
        <div><span className="evh-eyebrow">DESCUBRE TU PRÓXIMO FAVORITO</span><h2>Todo para tu hogar</h2></div>
        <Link to="/catalogo">Ver catálogo completo ↗</Link>
      </div>
      <div className="evh-category-grid">
        {categories.map(category => (
          <Link className="evh-category-card" to="/catalogo" key={category.name}>
            <span className="evh-category-icon" aria-hidden="true">{category.icon}</span>
            <strong>{category.name}</strong>
            <span>{category.detail}</span>
            <b aria-hidden="true">↗</b>
          </Link>
        ))}
      </div>
    </section>

    <section className="evh-guide-promo" aria-labelledby="evh-guide-promo-title">
      <div className="evh-guide-promo-copy">
        <span className="evh-eyebrow">DESCUBRE CON INTENCIÓN</span>
        <h2 id="evh-guide-promo-title">No elijas a ciegas. Encuentra lo que de verdad necesitas.</h2>
        <p>Cuéntale a la Guía ElectroVibe qué necesitas en casa y descubre sugerencias del catálogo para explorar distintas opciones.</p>
      </div>
      <Link className="evh-button evh-button-primary" to="/catalogo">Probar la Guía ElectroVibe <span aria-hidden="true">→</span></Link>
    </section>

    <section className="evh-promise">
      <div><span>01</span><strong>Explora con facilidad</strong><p>Consulta productos y disponibilidad sin complicaciones.</p></div>
      <div><span>02</span><strong>Decide con información clara</strong><p>Revisa las características, las cantidades y los detalles de tu pedido antes de confirmarlo.</p></div>
      <div><span>03</span><strong>Ten el control</strong><p>Accede a tu cuenta, administra tus preferencias y consulta el estado de tus pedidos.</p></div>
    </section>
  </main>
);

export default LandingPage;
