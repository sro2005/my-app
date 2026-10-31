import React from 'react';
import { Link } from 'react-router-dom';
import catalogCategoryGroups from '../utils/catalogCategoryGroups';

const CategoryIcon = ({ name }) => {
  const drawings = {
    refrigeration: <><rect x="19" y="6" width="26" height="52" rx="5" /><path d="M19 31h26M39 16v9m0 12v9" /></>,
    laundry: <><rect x="11" y="5" width="42" height="54" rx="6" /><path d="M11 19h42" /><circle cx="32" cy="38" r="13" /><path d="M23 38c5-7 11 6 18-2M20 12h.1M27 12h.1" /></>,
    kitchen: <><path d="M10 31h44l-5 24H15zM17 24c0-4 3-6 3-10m10 10c0-4 3-6 3-10m10 10c0-4 3-6 3-10" /><path d="M21 40h22" /></>,
    cleaning: <><path d="M18 53h28a8 8 0 0 0-8-8h-7V25a12 12 0 0 0-24 0v12" /><path d="M7 37h15l6 8M12 55h40" /><circle cx="31" cy="25" r="4" /></>,
    climate: <><circle cx="32" cy="27" r="5" /><path d="M32 22c-8-15 2-20 8-14l-5 15M37 28c17-7 22 4 15 11l-15-7M29 32c-3 18-17 16-18 7l16-13M32 32v25M19 58h26" /></>,
    'personal-care': <><path d="M14 20h28l10 9-10 9H14zM27 38l-5 18h17l4-18" /><path d="M8 24h6m-6 10h6M47 17l6-5m-4 13 8-2" /></>,
    technology: <><rect x="5" y="9" width="35" height="28" rx="3" /><path d="M17 43h12m-6-6v6M10 15h25v16H10z" /><rect x="43" y="22" width="14" height="32" rx="3" /><path d="M48 27h4m-4 21h4" /></>
  };
  return (
    <svg className="evh-category-art" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
      <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        {drawings[name] || drawings.technology}
      </g>
    </svg>
  );
};

const LandingPage = () => (
  <main className="evh-landing">
    <section className="evh-hero">
      <div className="evh-hero-copy">
        <span className="evh-eyebrow evh-hero-tagline">ELECTRODOMÉSTICOS Y TECNOLOGÍA PARA TU HOGAR</span>
        <h1>Un hogar que funciona mejor. <span>Un día a día más fácil.</span></h1>
        <p>Encuentra electrodomésticos y tecnología para cada espacio. Explora categorías, compara opciones y elige con más claridad lo que necesitas.</p>
        <div className="evh-hero-actions">
          <Link className="evh-button evh-button-primary" to="/catalogo">Explorar el Catálogo <span aria-hidden="true">→</span></Link>
          <Link className="evh-button evh-button-secondary" to="/guia-electrovibe">Probar la Guía ElectroVibe</Link>
        </div>
        <div className="evh-trust-row" aria-label="Ventajas de ElectroVibeHome">
          <span><strong aria-hidden="true">✓</strong> Categorías organizadas</span>
          <span><strong aria-hidden="true">✓</strong> Opciones para distintos espacios</span>
          <span><strong aria-hidden="true">✓</strong> Orientación gratuita para elegir</span>
        </div>
        <p className="evh-landing-account">¿Primera vez en ElectroVibeHome? <Link to="/register">Crea tu cuenta</Link></p>
      </div>

      <div className="evh-hero-art evh-smart-home-illustration" aria-label="Ilustración de un refrigerador, un televisor y una lavadora" role="img">
        <div className="evh-scene-halo" />
        <div className="evh-scene-showcase">
          <div className="evh-scene-appliance evh-scene-fridge">
            <span className="evh-fridge-badge" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" focusable="false"><path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M8.5 5.1 12 8l3.5-2.9M8.5 18.9 12 16l3.5 2.9M3.7 11l4.2.4-.7 4.1M20.3 13l-4.2-.4.7-4.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
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
        <div className="evh-art-label">Tecnología que acompaña tu vida en casa.</div>
      </div>
    </section>

    <section className="evh-categories" aria-labelledby="evh-categories-title">
      <div className="evh-section-heading">
        <div>
          <span className="evh-eyebrow">EXPLORA POR NECESIDAD</span>
          <h2 id="evh-categories-title">Encuentra lo que buscas para cada espacio</h2>
          <p>Las categorías están organizadas según los productos disponibles en nuestro catálogo.</p>
        </div>
        <Link to="/catalogo">Ver todos los productos <span aria-hidden="true">↗</span></Link>
      </div>

      <div className="evh-category-grid">
        {catalogCategoryGroups.map(category => (
          <Link
            className="evh-category-card"
            to={`/catalogo?grupo=${category.slug}`}
            key={category.slug}
            aria-label={`${category.name}. Ver ${category.categories.length} ${category.categories.length === 1 ? 'categoría' : 'categorías'} en el catálogo`}
          >
            <span className="evh-category-icon"><CategoryIcon name={category.icon} /></span>
            <strong>{category.name}</strong>
            <span className="evh-category-description">{category.description}</span>
            <small className="evh-category-includes">{category.preview}</small>
            <span className="evh-category-link">Ver opciones <b aria-hidden="true">→</b></span>
          </Link>
        ))}
      </div>
    </section>

    <section className="evh-guide-promo" aria-labelledby="evh-guide-promo-title">
      <div className="evh-guide-promo-icon" aria-hidden="true">
        <svg viewBox="0 0 64 64" fill="none" focusable="false">
          <path d="M32 5 37.5 23 55 29 37.5 35 32 54 26.5 35 9 29 26.5 23 32 5Z" />
          <path d="m49 41 2.5 8 7.5 2.5-7.5 2.5-2.5 8-2.5-8L39 51.5l7.5-2.5 2.5-8Z" />
        </svg>
      </div>
      <div className="evh-guide-promo-copy">
        <span className="evh-eyebrow">¿NO SABES POR DÓNDE EMPEZAR?</span>
        <h2 id="evh-guide-promo-title">Cuéntanos qué quieres mejorar en casa.</h2>
        <p>La Guía ElectroVibe revisa las opciones del catálogo y te orienta según la tarea, el espacio o la necesidad que quieras resolver.</p>
        <span className="evh-guide-benefit">Orientación gratuita basada en el catálogo disponible.</span>
      </div>
      <Link className="evh-button evh-button-primary" to="/guia-electrovibe">
        Probar la Guía ElectroVibe <span aria-hidden="true">→</span>
      </Link>
    </section>

    <section className="evh-promise" aria-label="Cómo aprovechar ElectroVibeHome">
      <div>
        <span>01</span>
        <strong>Explora a tu manera</strong>
        <p>Encuentra productos por categoría o utiliza la búsqueda para ir directo a lo que necesitas.</p>
      </div>
      <div>
        <span>02</span>
        <strong>Compara antes de elegir</strong>
        <p>Consulta descripciones, precios de referencia y detalles para tomar una decisión informada.</p>
      </div>
      <div>
        <span>03</span>
        <strong>Haz seguimiento</strong>
        <p>Desde tu cuenta puedes consultar tus pedidos y revisar sus actualizaciones.</p>
      </div>
    </section>
  </main>
);

export default LandingPage;
