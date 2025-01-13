// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client'; // Importa de 'react-dom/client'
import App from './App';
import './styles/styles.css';

const root = ReactDOM.createRoot(document.getElementById('root')); // Crea un root
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);