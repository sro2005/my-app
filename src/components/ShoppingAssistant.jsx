import React, { useState } from 'react';
import { formatCop as formatIllustrativePrice } from '../utils/currency';

const starterMessage = {
  role: 'assistant',
  content: 'Cuéntame qué quieres mejorar en casa y te ayudo a encontrar una opción que encaje contigo.'
};

const normalize = value => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase();

const categorySignals = [
  {
    terms: ['cocina', 'cocinar', 'cafe', 'cafetera', 'desayuno', 'comida', 'hornear', 'batir', 'licuar', 'tostar', 'sandwich', 'microondas'],
    categories: ['Cafeteras', 'Batidoras', 'Licuadoras', 'Microondas', 'Tostadoras', 'Sandwicheras', 'Estufas']
  },
  {
    terms: ['ropa', 'lavar', 'lavadora', 'planchar', 'plancha', 'prenda', 'lavado'],
    categories: ['Lavadoras', 'Planchas de Ropa']
  },
  {
    terms: ['cabello', 'pelo', 'secador', 'peinar'],
    categories: ['Secadores de Cabello']
  },
  {
    terms: ['limpiar', 'limpieza', 'polvo', 'aspirar', 'aspiradora'],
    categories: ['Aspiradoras']
  },
  {
    terms: ['frio', 'calor', 'temperatura', 'ventilar', 'ventilador', 'clima'],
    categories: ['Aires Acondicionados', 'Ventiladores']
  },
  {
    terms: ['estudiar', 'trabajar', 'oficina', 'computador', 'portatil', 'computadora', 'productividad', 'impresora', 'tablet'],
    categories: ['Computadores Portátiles', 'Computadores de Escritorio', 'Impresoras', 'Tablets']
  },
  {
    terms: ['juego', 'juegos', 'videojuego', 'gaming', 'consola', 'televisor', 'television', 'pelicula', 'streaming', 'parlante', 'musica', 'audio'],
    categories: ['Consolas de Videojuegos', 'Televisores', 'Bocinas Inteligentes o Parlantes Bluetooth']
  },
  {
    terms: ['movil', 'celular', 'telefono', 'llamada'],
    categories: ['Celulares']
  },
  {
    terms: ['nevera', 'refrigerar', 'conservar', 'refrigerador', 'alimento', 'congelar'],
    categories: ['Refrigeradores']
  }
];

const stopWords = new Set([
  'algo', 'para', 'como', 'quiero', 'busco', 'necesito', 'ayuda', 'una', 'uno',
  'unos', 'unas', 'que', 'por', 'con', 'sin', 'del', 'los', 'las', 'este',
  'esta', 'esto', 'mi', 'mis', 'tu', 'tus', 'casa', 'hogar', 'mejorar',
  'opciones', 'hay', 'mas', 'muy', 'practico', 'practica', 'pequena',
  'pequeno', 'tiempo', 'ahorrar', 'comodidad', 'una', 'unos', 'unas'
]);

const buildLocalRecommendation = (query, products) => {
  const normalizedQuery = normalize(query);
  const matchedCategories = new Set();
  categorySignals.forEach(signal => {
    if (signal.terms.some(term => normalizedQuery.includes(normalize(term)))) {
      signal.categories.forEach(category => matchedCategories.add(normalize(category)));
    }
  });

  // A broad request about comfort should clarify the user's priority instead of
  // returning arbitrary products just because the query has no specific category.
  const generalComfortIntent = /\b(comodidad|comodo|comoda|confort|bienestar)\b/.test(normalizedQuery);
  if (generalComfortIntent && matchedCategories.size === 0) {
    return '¡Claro! Para recomendarte algo que de verdad mejore tu comodidad, ¿qué te gustaría resolver primero: mantener una temperatura agradable (aires acondicionados o ventiladores), reducir el tiempo de limpieza (aspiradoras), agilizar la cocina (cafeteras, licuadoras o microondas) o mejorar el entretenimiento (televisores o parlantes)? Dime cuál te importa más y revisaré las opciones disponibles en el catálogo.';
  }

  const queryWords = normalizedQuery.split(/\s+/)
    .filter(word => word.length >= 4 && !stopWords.has(word));
  const ranked = (Array.isArray(products) ? products : [])
    .filter(product => Number(product.quantity) > 0)
    .map(product => {
      const name = normalize(product.name);
      const category = normalize(product.category);
      const description = normalize(product.description);
      let score = matchedCategories.has(category) ? 5 : 0;
      queryWords.forEach(word => {
        if (name.includes(word)) score += 4;
        else if (category.includes(word)) score += 3;
        else if (description.includes(word)) score += 1;
      });
      return { product, score };
    })
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score || Number(a.product.price) - Number(b.product.price))
    .slice(0, 3);

  if (ranked.length === 0) {
    return 'Por ahora no encuentro una coincidencia clara en el catálogo. Cuéntame qué quieres resolver en casa —por ejemplo, cocinar, cuidar la ropa, limpiar o estudiar— y te sugeriré categorías para explorar.';
  }

  const suggestions = ranked.map(({ product }) =>
    product.name + ' (' + product.category + ', precio de referencia ' + formatIllustrativePrice(product.price) + ')'
  ).join('; ');

  return 'Según lo que describes, estas opciones del catálogo podrían servirte: ' +
    suggestions +
    '. Revisa las características y cuéntame qué uso o presupuesto tienes para afinar la búsqueda.';
};

const ShoppingAssistant = ({ products = [] }) => {
  const [messages, setMessages] = useState([starterMessage]);
  const [draft, setDraft] = useState('');
  const canUseGuide = Array.isArray(products) && products.length > 0;

  const sendMessage = event => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !canUseGuide) return;

    const reply = buildLocalRecommendation(content, products);
    setMessages(current => [
      ...current,
      { role: 'user', content },
      { role: 'assistant', content: reply }
    ].slice(-8));
    setDraft('');
  };

  const useSuggestion = suggestion => setDraft(suggestion);
  const assistantState = canUseGuide ? 'Orientación local disponible' : 'Guía no disponible';

  return (
    <section className="evh-assistant" aria-labelledby="evh-assistant-title">
      <div className="evh-assistant-intro">
        <span className="evh-eyebrow">UNA GUÍA PARA TU HOGAR</span>
        <h2 id="evh-assistant-title">Encuentra lo que va contigo.</h2>
        <p>Cuéntale a la Guía ElectroVibe qué necesitas. Revisará el catálogo disponible y te ayudará a comparar opciones.</p>
        <div className="evh-assistant-prompts" aria-label="Ideas para empezar">
          <button type="button" disabled={!canUseGuide} onClick={() => useSuggestion('Busco algo práctico para una cocina pequeña.')}>Cocina pequeña</button>
          <button type="button" disabled={!canUseGuide} onClick={() => useSuggestion('Quiero ahorrar tiempo en el cuidado de la ropa.')}>Cuidar la ropa</button>
          <button type="button" disabled={!canUseGuide} onClick={() => useSuggestion('Quiero hacer mi casa más cómoda y no sé por dónde empezar.')}>Más comodidad</button>
        </div>
      </div>

      <div className="evh-assistant-chat">
        <div className="evh-assistant-heading">
          <span className="evh-assistant-mark" aria-hidden="true">✦</span>
          <div><strong>Guía ElectroVibe</strong><span>Orientación local de catálogo</span></div>
          <span className={`evh-assistant-status ${canUseGuide ? 'is-ready' : ''}`} aria-label={assistantState} />
        </div>

        <div className="evh-assistant-messages" aria-live="polite" aria-relevant="additions text">
          {messages.map((message, index) => (
            <p className={`evh-assistant-message is-${message.role}`} key={`${message.role}-${index}`}>{message.content}</p>
          ))}
        </div>

        {canUseGuide ? (
          <>
            <form className="evh-assistant-form" onSubmit={sendMessage}>
              <label className="evh-sr-only" htmlFor="evh-assistant-input">Escribe qué necesitas para tu hogar</label>
              <input id="evh-assistant-input" value={draft} onChange={event => setDraft(event.target.value)} maxLength={500} placeholder="¿Qué estás buscando para tu hogar?" />
              <button type="submit" disabled={!draft.trim()} aria-label="Enviar pregunta">Enviar</button>
            </form>
            <p className="evh-assistant-note">Guía gratuita sin API de IA: usa los nombres, categorías, descripciones y precios del catálogo para orientar la búsqueda. Tus mensajes se procesan en este navegador y no se envían a servicios externos.</p>
          </>
        ) : (
          <>
            <p className="evh-assistant-note">La guía estará disponible cuando el catálogo tenga productos para recomendar.</p>
            <p className="evh-assistant-note">Guía gratuita sin API de IA: no envía mensajes a servicios externos ni genera cargos de IA.</p>
          </>
        )}
      </div>
    </section>
  );
};

export { buildLocalRecommendation };
export default ShoppingAssistant;
