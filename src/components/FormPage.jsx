import React from 'react';
import { Link } from 'react-router-dom';

const FormPage = ({ eyebrow, title, description, children, className = '' }) => (
  <main className={`evh-form-page ${className}`.trim()}>
    <section className="evh-form-layout">
      <aside className="evh-form-story">
        <Link className="evh-form-brand" to="/" aria-label="ElectroVibeHome, ir al inicio">
          <span aria-hidden="true">⚡</span> ELECTROVIBEHOME
        </Link>
        <div className="evh-form-story-copy">
          <span className="evh-form-story-label">TECNOLOGÍA QUE SE SIENTE EN CASA</span>
          <h2>Vive mejor.<br />Vive conectado.</h2>
          <p>Un hogar más cómodo empieza con decisiones que van contigo.</p>
        </div>
        <div className="evh-form-story-orbit" aria-hidden="true"><span>⌂</span></div>
      </aside>

      <section className="evh-form-content" aria-labelledby="evh-form-title">
        <div className="evh-form-heading">
          <span className="evh-eyebrow">{eyebrow}</span>
          <h1 id="evh-form-title">{title}</h1>
          <p>{description}</p>
        </div>
        {children}
      </section>
    </section>
  </main>
);

export default FormPage;
