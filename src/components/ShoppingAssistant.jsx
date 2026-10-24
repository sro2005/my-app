import React, { useEffect, useState } from 'react';
import axios from 'axios';

const getApiUrl = () => process.env.REACT_APP_API_BASE_URL;
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
    categories: ['Aires Acondicionados', 'Ventiladores', 'Refrigeradores']
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

const formatIllustrativePrice = price => new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
}).format(Number(price) || 0);

const buildLocalRecommendation = (query, products) => {
  const normalizedQuery = normalize(query);
  const matchedCategories = new Set();
  categorySignals.forEach(signal => {
    if (signal.terms.some(term => normalizedQuery.includes(normalize(term)))) {
      signal.categories.forEach(category => matchedCategories.add(normalize(category)));
    }
  });

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
    return 'Modo de demostración local: todavía no encuentro una coincidencia clara en el catálogo. Cuéntame qué tarea quieres resolver (por ejemplo, preparar alimentos, cuidar la ropa, limpiar o estudiar) y te sugeriré categorías para explorar. Esta guía usa reglas sencillas, no una IA generativa.';
  }

  const suggestions = ranked.map(({ product }) =>
    product.name + ' (' + product.category + ', precio ilustrativo ' + formatIllustrativePrice(product.price) + ')'
  ).join('; ');

  return 'Modo de demostración local: según lo que describes, estas opciones del catálogo podrían servirte: ' +
    suggestions +
    '. Los precios y existencias son ilustrativos. Revisa las características antes de decidir y cuéntame qué uso o presupuesto tienes para afinar la búsqueda.';
};

const ShoppingAssistant = ({ products = [] }) => {
  const [enabled, setEnabled] = useState(false);
  const [statusLoaded, setStatusLoaded] = useState(false);
  const [messages, setMessages] = useState([starterMessage]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const apiUrl = getApiUrl();
    if (!apiUrl) {
      setStatusLoaded(true);
      return () => { active = false; };
    }

    axios.get(`${apiUrl}/api/assistant/status`)
      .then(({ data }) => {
        if (active) setEnabled(data.enabled === true);
      })
      .catch(() => {
        if (active) setEnabled(false);
      })
      .finally(() => {
        if (active) setStatusLoaded(true);
      });

    return () => { active = false; };
  }, []);

  const localMode = statusLoaded && !enabled && products.length > 0;
  const canUseGuide = statusLoaded && (enabled || localMode);

  const sendMessage = async (event) => {
    event.preventDefault();
    const content = draft.trim();
    const apiUrl = getApiUrl();
    if (!content || !canUseGuide || loading) return;

    const nextMessages = [...messages, { role: 'user', content }].slice(-8);
    setMessages(nextMessages);
    setDraft('');
    setError('');
    setLoading(true);

    if (!enabled) {
      setMessages(current => [
        ...current,
        { role: 'assistant', content: buildLocalRecommendation(content, products) }
      ].slice(-8));
      setLoading(false);
      return;
    }

    try {
      const { data } = await axios.post(`${apiUrl}/api/assistant/chat`, { messages: nextMessages });
      setMessages(current => [...current, { role: 'assistant', content: data.reply }].slice(-8));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No pude responder ahora. Prueba de nuevo en un momento.');
    } finally {
      setLoading(false);
    }
  };

  const useSuggestion = (suggestion) => setDraft(suggestion);

  const assistantState = enabled
    ? 'Asistente disponible'
    : !statusLoaded
      ? 'Comprobando disponibilidad'
      : localMode
        ? 'Guía en modo local'
        : 'Asistente sin configurar';

  return (
    <section className="evh-assistant" aria-labelledby="evh-assistant-title">
      <div className="evh-assistant-intro">
        <span className="evh-eyebrow">UNA GUÍA PARA TU HOGAR</span>
        <h2 id="evh-assistant-title">Encuentra lo que va contigo.</h2>
        <p>Cuéntale a la Guía ElectroVibe qué necesitas. Revisará el catálogo disponible y te ayudará a comparar opciones.</p>
        <div className="evh-assistant-prompts" aria-label="Ideas para empezar">
          <button type="button" disabled={!canUseGuide} onClick={() => useSuggestion('Busco algo práctico para una cocina pequeña.')}>Cocina pequeña</button>
          <button type="button" disabled={!canUseGuide} onClick={() => useSuggestion('Quiero ahorrar tiempo en el cuidado de la ropa.')}>Cuidar la ropa</button>
          <button type="button" disabled={!canUseGuide} onClick={() => useSuggestion('¿Qué opciones hay para mejorar la comodidad en casa?')}>Más comodidad</button>
        </div>
      </div>

      <div className="evh-assistant-chat">
        <div className="evh-assistant-heading">
          <span className="evh-assistant-mark" aria-hidden="true">✦</span>
          <div><strong>Guía ElectroVibe</strong><span>{localMode ? 'Orientación local de catálogo' : 'Recomendaciones con intención'}</span></div>
          <span className={`evh-assistant-status ${enabled ? 'is-ready' : ''}`} aria-label={assistantState} />
        </div>

        <div className="evh-assistant-messages" aria-live="polite" aria-relevant="additions text">
          {messages.map((message, index) => (
            <p className={`evh-assistant-message is-${message.role}`} key={`${message.role}-${index}`}>{message.content}</p>
          ))}
          {loading && <p className="evh-assistant-message is-assistant" role="status">Estoy revisando las opciones del catálogo…</p>}
        </div>

        {!statusLoaded ? (
          <p className="evh-assistant-note">Conectando la guía…</p>
        ) : canUseGuide ? (
          <>
            {error && <p className="evh-assistant-error" role="alert">{error}</p>}
            <form className="evh-assistant-form" onSubmit={sendMessage}>
              <label className="evh-sr-only" htmlFor="evh-assistant-input">Escribe qué necesitas para tu hogar</label>
              <input id="evh-assistant-input" value={draft} onChange={event => setDraft(event.target.value)} maxLength={500} placeholder="¿Qué estás buscando para tu hogar?" disabled={loading} />
              <button type="submit" disabled={loading || !draft.trim()} aria-label="Enviar pregunta">Enviar</button>
            </form>
            {enabled ? (
              <p className="evh-assistant-note">Tus mensajes se envían a OpenAI para generar recomendaciones y ElectroVibeHome no guarda el historial. Evita incluir datos personales.</p>
            ) : (
              <p className="evh-assistant-note">Modo de demostración local: tus mensajes se procesan en el navegador con el catálogo disponible. No se envían a OpenAI ni se guardan. Las sugerencias usan reglas sencillas, no IA generativa.</p>
            )}
          </>
        ) : (
          <p className="evh-assistant-note">La guía no tiene productos disponibles en este momento. Prueba de nuevo cuando el catálogo esté cargado.</p>
        )}
      </div>
    </section>
  );
};

export { buildLocalRecommendation };
export default ShoppingAssistant;
