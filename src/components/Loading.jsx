import LoadingBrandMark from './LoadingBrandMark';
import React from 'react';

const Loading = () => (
  <main className="evh-app-loading" role="status" aria-live="polite">
    <div className="evh-app-loading-card">
      <span className="evh-app-loading-mark" aria-hidden="true"><LoadingBrandMark /></span>
      <div className="evh-app-loading-copy">
        <span className="evh-loading-kicker">ELECTROVIBEHOME</span>
        <h1>Preparando tu espacio</h1>
        <p>Estamos organizando todo para que continúes con comodidad.</p>
        <div className="evh-loading-lines" aria-hidden="true"><span /><span /><span /></div>
      </div>
    </div>
  </main>
);

export default Loading;
