import React from 'react';
import { Link } from 'react-router-dom';

const InformationalPage = ({ eyebrow, title, lead, notice, sections }) => (
  <main className="evh-info-page">
    <div className="evh-info-container">
      <Link className="evh-info-back" to="/">← Volver al inicio</Link>
      <header className="evh-info-heading">
        <span className="evh-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{lead}</p>
      </header>

      <aside className="evh-info-notice">
        <strong>Alcance de esta página</strong>
        <p>{notice}</p>
      </aside>

      <div className="evh-info-sections">
        {sections.map(section => (
          <section className="evh-info-section" key={section.title}>
            <h2>{section.title}</h2>
            {section.body && <p>{section.body}</p>}
            {section.items && (
              <ul>
                {section.items.map(item => <li key={item}>{item}</li>)}
              </ul>
            )}
          </section>
        ))}
      </div>

      <div className="evh-info-contact">
        <div>
          <span className="evh-eyebrow">ELECTROVIBEHOME</span>
          <h2>¿Quieres seguir explorando?</h2>
          <p>Conoce las categorías y productos que dan vida a esta idea.</p>
        </div>
        <Link to="/catalogo">Ver catálogo</Link>
      </div>
    </div>
  </main>
);

export default InformationalPage;
