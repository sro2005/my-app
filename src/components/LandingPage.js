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
        <span className="evh-eyebrow">TECNOLOGÍA QUE SE SIENTE EN CASA</span>
        <h1>Tu hogar merece algo <span>extraordinario.</span></h1>
        <p>Encuentra electrodomésticos que combinan funcionalidad, comodidad y estilo para tu día a día.</p>
        <div className="evh-hero-actions">
          <Link className="evh-button evh-button-primary" to="/catalogo">Explorar productos <span aria-hidden="true">→</span></Link>
          <Link className="evh-button evh-button-secondary" to="/register">Crear mi cuenta</Link>
        </div>
        <div className="evh-trust-row">
          <span><strong>✓</strong> Compra sencilla</span>
          <span><strong>✓</strong> Pago seguro con Wompi</span>
        </div>
      </div>
      <div className="evh-hero-art" aria-label="Ilustración de electrodomésticos para el hogar" role="img">
        <div className="evh-orbit evh-orbit-one" />
        <div className="evh-orbit evh-orbit-two" />
        <div className="evh-appliance evh-fridge"><span>❄</span><i /></div>
        <div className="evh-appliance evh-washer"><span>◉</span><i /></div>
        <div className="evh-appliance evh-microwave"><span>▦</span><i /></div>
        <div className="evh-art-label">Vive mejor. Vive conectado.</div>
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

    <section className="evh-promise">
      <div><span>01</span><strong>Explora con facilidad</strong><p>Consulta productos y disponibilidad sin complicaciones.</p></div>
      <div><span>02</span><strong>Paga con confianza</strong><p>El pago se completa en el checkout oficial de Wompi.</p></div>
      <div><span>03</span><strong>Ten el control</strong><p>Accede a tu cuenta y consulta el estado de tus pedidos.</p></div>
    </section>
  </main>
);

export default LandingPage;
