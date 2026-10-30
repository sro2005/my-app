import React from 'react';
import LoadingBrandMark from './LoadingBrandMark';

const Loading = ({
  title = 'Preparando tu espacio',
  description = 'Estamos organizando todo para que continúes con comodidad.'
}) => (
  <main className="evh-app-loading" role="status" aria-live="polite">
    <div className="evh-app-loading-card">
      <span className="evh-app-loading-mark" aria-hidden="true"><LoadingBrandMark /></span>
      <div className="evh-app-loading-copy">
        <span className="evh-loading-kicker">ELECTROVIBEHOME</span>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="evh-loading-lines" aria-hidden="true"><span /><span /><span /></div>
      </div>
    </div>
  </main>
);

export default Loading;
