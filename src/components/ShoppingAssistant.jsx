import React, { useEffect, useState } from 'react';
import axios from 'axios';

const getApiUrl = () => process.env.REACT_APP_API_BASE_URL;
const starterMessage = {
  role: 'assistant',
  content: 'Cuéntame qué quieres mejorar en casa y te ayudo a encontrar una opción que encaje contigo.'
};

const ShoppingAssistant = () => {
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

  const sendMessage = async (event) => {
    event.preventDefault();
    const content = draft.trim();
    const apiUrl = getApiUrl();
    if (!content || !enabled || loading) return;

    const nextMessages = [...messages, { role: 'user', content }].slice(-8);
    setMessages(nextMessages);
    setDraft('');
    setError('');
    setLoading(true);

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

  return (
    <section className="evh-assistant" aria-labelledby="evh-assistant-title">
      <div className="evh-assistant-intro">
        <span className="evh-eyebrow">UNA GUÍA PARA TU HOGAR</span>
        <h2 id="evh-assistant-title">Encuentra lo que va contigo.</h2>
        <p>Cuéntale a la Guía ElectroVibe qué necesitas. Revisará el catálogo disponible y te ayudará a comparar opciones.</p>
        <div className="evh-assistant-prompts" aria-label="Ideas para empezar">
          <button type="button" disabled={!enabled} onClick={() => useSuggestion('Busco algo práctico para una cocina pequeña.')}>Cocina pequeña</button>
          <button type="button" disabled={!enabled} onClick={() => useSuggestion('Quiero ahorrar tiempo en el cuidado de la ropa.')}>Cuidar la ropa</button>
          <button type="button" disabled={!enabled} onClick={() => useSuggestion('¿Qué opciones hay para mejorar la comodidad en casa?')}>Más comodidad</button>
        </div>
      </div>

      <div className="evh-assistant-chat">
        <div className="evh-assistant-heading">
          <span className="evh-assistant-mark" aria-hidden="true">✦</span>
          <div><strong>Guía ElectroVibe</strong><span>Recomendaciones con intención</span></div>
          <span className={`evh-assistant-status ${enabled ? 'is-ready' : ''}`} aria-label={enabled ? 'Asistente disponible' : 'Asistente sin configurar'} />
        </div>

        <div className="evh-assistant-messages" aria-live="polite" aria-relevant="additions text">
          {messages.map((message, index) => (
            <p className={`evh-assistant-message is-${message.role}`} key={`${message.role}-${index}`}>{message.content}</p>
          ))}
          {loading && <p className="evh-assistant-message is-assistant" role="status">Estoy revisando las opciones del catálogo…</p>}
        </div>

        {!statusLoaded ? (
          <p className="evh-assistant-note">Conectando la guía…</p>
        ) : enabled ? (
          <>
            {error && <p className="evh-assistant-error" role="alert">{error}</p>}
            <form className="evh-assistant-form" onSubmit={sendMessage}>
              <label className="evh-sr-only" htmlFor="evh-assistant-input">Escribe qué necesitas para tu hogar</label>
              <input id="evh-assistant-input" value={draft} onChange={event => setDraft(event.target.value)} maxLength={500} placeholder="¿Qué estás buscando para tu hogar?" disabled={loading} />
              <button type="submit" disabled={loading || !draft.trim()} aria-label="Enviar pregunta">Enviar</button>
            </form>
            <p className="evh-assistant-note">Tus mensajes se envían a OpenAI para generar recomendaciones y ElectroVibeHome no guarda el historial. Evita incluir datos personales.</p>
          </>
        ) : (
          <p className="evh-assistant-note">La guía está en preparación. Mientras tanto, explora las opciones disponibles en el catálogo.</p>
        )}
      </div>
    </section>
  );
};

export default ShoppingAssistant;
