import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import Select from 'react-select';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import GenderAvatar, { getGenderLabel } from './GenderAvatar';

const preferencesOptions = [
  { value: 'Aires Acondicionados', label: 'Aires acondicionados' },
  { value: 'Aspiradoras', label: 'Aspiradoras' },
  { value: 'Batidoras', label: 'Batidoras' },
  { value: 'Bocinas Inteligentes o Parlantes Bluetooth', label: 'Parlantes Bluetooth / inteligentes' },
  { value: 'Cafeteras', label: 'Cafeteras' },
  { value: 'Celulares', label: 'Celulares' },
  { value: 'Computadores de Escritorio', label: 'Computadores de escritorio' },
  { value: 'Computadores Portátiles', label: 'Computadores portátiles' },
  { value: 'Consolas de Videojuegos', label: 'Consolas de videojuegos' },
  { value: 'Estufas', label: 'Estufas' },
  { value: 'Impresoras', label: 'Impresoras' },
  { value: 'Lavadoras', label: 'Lavadoras' },
  { value: 'Licuadoras', label: 'Licuadoras' },
  { value: 'Microondas', label: 'Microondas' },
  { value: 'Planchas de Ropa', label: 'Planchas de ropa' },
  { value: 'Refrigeradores', label: 'Refrigeradores' },
  { value: 'Sandwicheras', label: 'Sandwicheras' },
  { value: 'Secadores de Cabello', label: 'Secadores de cabello' },
  { value: 'Tablets', label: 'Tablets' },
  { value: 'Televisores', label: 'Televisores' },
  { value: 'Tostadoras', label: 'Tostadoras' },
  { value: 'Ventiladores', label: 'Ventiladores' }
];

const getApiUrl = () => (process.env.REACT_APP_API_BASE_URL || '').trim().replace(/\/$/, '');

const getTodayInBogota = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date()).reduce((result, part) => {
    if (part.type !== 'literal') result[part.type] = part.value;
    return result;
  }, {});
  return parts.year + '-' + parts.month + '-' + parts.day;
};

const asPreferenceValues = (preferences) => {
  if (!Array.isArray(preferences)) return [];
  return preferences
    .map((preference) => typeof preference === 'string' ? preference : preference?.value)
    .filter((preference) => typeof preference === 'string' && preference.trim());
};

const optionsForPreferences = (preferences) => {
  const knownValues = new Set(preferencesOptions.map((option) => option.value));
  const extraOptions = asPreferenceValues(preferences)
    .filter((value) => !knownValues.has(value))
    .map((value) => ({ value, label: value }));
  return [...preferencesOptions, ...extraOptions];
};

const getSelectedPreferences = (preferences) => {
  const values = asPreferenceValues(preferences);
  const options = optionsForPreferences(values);
  return values.map((value) => options.find((option) => option.value === value)).filter(Boolean);
};

const formFromCustomer = (customer) => ({
  firstName: customer?.firstName || '',
  lastName: customer?.lastName || '',
  email: customer?.email || '',
  birthDate: formatDateInput(customer?.birthDate),
  identificationNumber: customer?.identificationNumber || '',
  phone: customer?.phone || '',
  gender: customer?.gender || 'unspecified',
  preferences: getSelectedPreferences(customer?.preferences)
});

const formatIdentificationNumber = (number) => {
  const digits = String(number || '').replace(/\D/g, '').slice(0, 10);
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const formatDate = (value) => {
  if (!value) return 'No especificada';
  const text = String(value);
  const dateOnly = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
  if (dateOnly) return dateOnly[3] + '/' + dateOnly[2] + '/' + dateOnly[1];

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No disponible';
  return String(date.getUTCDate()).padStart(2, '0') + '/' +
    String(date.getUTCMonth() + 1).padStart(2, '0') + '/' + date.getUTCFullYear();
};

const formatDateInput = (value) => {
  if (!value) return '';
  const text = String(value);
  const dateOnly = text.match(/^\d{4}-\d{2}-\d{2}/);
  if (dateOnly) return dateOnly[0];
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.getUTCFullYear() + '-' +
    String(date.getUTCMonth() + 1).padStart(2, '0') + '-' +
    String(date.getUTCDate()).padStart(2, '0');
};

const PerfilCliente = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [customer, setCustomer] = useState(null);
  const [formData, setFormData] = useState(formFromCustomer(user));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [localFallback, setLocalFallback] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('authToken');
    const apiUrl = getApiUrl();

    const showSessionFallback = (message) => {
      if (!active) return;
      if (user && user._id) {
        setCustomer(user);
        setFormData(formFromCustomer(user));
        setLocalFallback(true);
      }
      setLoadError(message);
      setLoading(false);
    };

    if (!token) {
      showSessionFallback('No encontramos una sesión activa. Inicia sesión de nuevo para sincronizar tu perfil.');
      return () => { active = false; };
    }
    if (!apiUrl) {
      showSessionFallback('La URL de la API no está configurada. Mostramos los datos disponibles en esta sesión.');
      return () => { active = false; };
    }

    setLoading(true);
    setLoadError('');
    axios.get(apiUrl + '/api/customers/profile', {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then(({ data }) => {
        if (!active) return;
        setCustomer(data);
        setFormData(formFromCustomer(data));
        setLocalFallback(false);
        setLoadError('');
      })
      .catch(() => {
        showSessionFallback('No pudimos sincronizar el perfil con el servidor. Si ves tus datos, provienen de la sesión guardada y son de solo lectura hasta recuperar la conexión.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [retryCount]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setFeedback(null);

    const apiUrl = getApiUrl();
    const token = localStorage.getItem('authToken');
    if (localFallback || !apiUrl || !token) {
      setFeedback({ type: 'error', message: 'No hay conexión con el servidor. Tus cambios no se han guardado.' });
      return;
    }
    if (!customer?._id) {
      setFeedback({ type: 'error', message: 'No encontramos el identificador del perfil. Vuelve a cargarlo e inténtalo de nuevo.' });
      return;
    }

    const updatedData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim().toLowerCase(),
      birthDate: formData.birthDate,
      identificationNumber: formatIdentificationNumber(formData.identificationNumber),
      phone: formData.phone.trim(),
      gender: formData.gender || 'unspecified',
      preferences: asPreferenceValues(formData.preferences)
    };

    setSaving(true);
    try {
      const { data } = await axios.put(apiUrl + '/api/customers/' + customer._id, updatedData, {
        headers: { Authorization: 'Bearer ' + token }
      });
      const updatedCustomer = data.updatedCustomer || data.customer || data;
      setCustomer(updatedCustomer);
      setFormData(formFromCustomer(updatedCustomer));
      updateUser(updatedCustomer);
      setIsEditing(false);
      setFeedback({ type: 'success', message: 'Tu perfil se actualizó correctamente.' });
    } catch (error) {
      const status = error.response?.status;
      const message = status === 409
        ? 'Ese correo o número de identificación ya está registrado.'
        : error.response?.data?.message || 'No pudimos guardar los cambios. Revisa la conexión e inténtalo de nuevo.';
      setFeedback({ type: 'error', message });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(formFromCustomer(customer));
    setIsEditing(false);
    setFeedback(null);
  };

  if (loading) {
    return (
      <main className="evh-profile-page evh-profile-loading" aria-busy="true">
        <div className="evh-loading-panel" role="status" aria-live="polite">
          <span className="evh-loading-mark" aria-hidden="true">EV</span>
          <div className="evh-loading-copy">
            <span className="evh-loading-kicker">TU ESPACIO PERSONAL</span>
            <h2>Preparando tu perfil</h2>
            <p>Estamos organizando tus datos y preferencias.</p>
            <div className="evh-loading-lines" aria-hidden="true"><span /><span /><span /></div>
          </div>
        </div>
      </main>
    );
  }

  if (!customer) {
    return (
      <main className="evh-profile-page evh-profile-state">
        <span className="evh-eyebrow">TU ESPACIO PERSONAL</span>
        <h1>No pudimos cargar tu perfil</h1>
        <p>{loadError || 'Comprueba tu conexión e inténtalo de nuevo.'}</p>
        <button type="button" className="evh-button evh-button-primary" onClick={() => setRetryCount((count) => count + 1)}>Intentar de nuevo</button>
        <Link to="/login" className="evh-profile-back-link">Volver al inicio de sesión</Link>
      </main>
    );
  }

  const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'Cliente ElectroVibe';
  return (
    <main className="evh-profile-page">
      <header className="evh-profile-heading">
        <div>
          <span className="evh-eyebrow">TU ESPACIO PERSONAL</span>
          <h1>Mi Perfil</h1>
          <p>Administra tus datos y las preferencias que usamos para mostrarte productos relevantes.</p>
        </div>
        <div className={`evh-profile-avatar evh-profile-avatar--${customer.gender || 'unspecified'}`} aria-label={'Perfil de ' + fullName}><GenderAvatar gender={customer.gender} size="profile" /></div>
      </header>

      {loadError && (
        <section className="evh-profile-alert is-warning" role="status">
          <div><strong>Perfil sin sincronizar</strong><p>{loadError}</p></div>
          <button type="button" onClick={() => setRetryCount((count) => count + 1)}>Reintentar</button>
        </section>
      )}
      {feedback && <p className={'evh-profile-alert ' + (feedback.type === 'success' ? 'is-success' : 'is-error')} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.message}</p>}

      <section className="evh-profile-card">
        <div className="evh-profile-card-heading">
          <div>
            <span className="evh-eyebrow">INFORMACIÓN DE LA CUENTA</span>
            <h2>{isEditing ? 'Editar tus datos' : fullName}</h2>
            <p>{isEditing ? 'Actualiza tus datos con cuidado; los cambios se enviarán al servidor.' : 'Mantén tus datos y preferencias al día.'}</p>
          </div>
          {!isEditing && (
            <button type="button" className="evh-button evh-button-secondary" onClick={() => { setFormData(formFromCustomer(customer)); setFeedback(null); setIsEditing(true); }} disabled={localFallback}>
              Editar Perfil
            </button>
          )}
        </div>

        {localFallback && <p className="evh-profile-readonly-note">Vista de solo lectura: los datos se tomaron de la sesión guardada y podrían estar desactualizados. Restablece la conexión para editar.</p>}

        {!isEditing ? (
          <div className="evh-profile-details">
            <div className="evh-profile-detail"><span>Nombre completo</span><strong>{fullName}</strong></div>
            <div className="evh-profile-detail"><span>Correo electrónico</span><strong>{customer.email || 'No disponible'}</strong></div>
            <div className="evh-profile-detail"><span>Fecha de nacimiento</span><strong>{formatDate(customer.birthDate)}</strong></div>
            <div className="evh-profile-detail"><span>Número de identificación</span><strong>{formatIdentificationNumber(customer.identificationNumber) || 'No disponible'}</strong></div>
            <div className="evh-profile-detail"><span>Celular</span><strong>{customer.phone || 'No disponible'}</strong></div>
            <div className="evh-profile-detail"><span>Género</span><strong>{getGenderLabel(customer.gender)}</strong></div>
            <div className="evh-profile-detail evh-profile-detail-wide">
              <span>Tus preferencias</span>
              <div className="evh-profile-chips">
                {asPreferenceValues(customer.preferences).length
                  ? asPreferenceValues(customer.preferences).map((preference) => <span key={preference}>{preference}</span>)
                  : <em>Aún no has seleccionado preferencias.</em>}
              </div>
            </div>
          </div>
        ) : (
          <form className="evh-profile-form" onSubmit={handleSave}>
            <div className="evh-profile-form-grid">
              <div className="evh-profile-field">
                <label htmlFor="profile-first-name">Nombre(s)</label>
                <input id="profile-first-name" name="firstName" value={formData.firstName} onChange={handleInputChange} minLength={1} maxLength={100} autoComplete="given-name" required />
              </div>
              <div className="evh-profile-field">
                <label htmlFor="profile-last-name">Apellido(s)</label>
                <input id="profile-last-name" name="lastName" value={formData.lastName} onChange={handleInputChange} minLength={1} maxLength={100} autoComplete="family-name" required />
              </div>
              <div className="evh-profile-field">
                <label htmlFor="profile-email">Correo electrónico</label>
                <input id="profile-email" name="email" type="email" value={formData.email} onChange={handleInputChange} maxLength={254} autoComplete="email" required />
              </div>
              <div className="evh-profile-field">
                <label htmlFor="profile-birth-date">Fecha de nacimiento</label>
                <input id="profile-birth-date" name="birthDate" type="date" value={formData.birthDate} onChange={handleInputChange} max={getTodayInBogota()} required />
              </div>
              <div className="evh-profile-field">
                <label htmlFor="profile-identification">Número de identificación</label>
                <input id="profile-identification" name="identificationNumber" value={formData.identificationNumber} onChange={handleInputChange} inputMode="numeric" maxLength={13} pattern="[0-9.]{1,13}" required />
              </div>
              <div className="evh-profile-field">
                <label htmlFor="profile-phone">Celular</label>
                <input id="profile-phone" name="phone" value={formData.phone} onChange={handleInputChange} type="tel" autoComplete="tel" minLength={7} maxLength={30} required />
              </div>
              <div className="evh-profile-field">
                <label htmlFor="profile-gender">Género (opcional)</label>
                <select id="profile-gender" name="gender" value={formData.gender || 'unspecified'} onChange={handleInputChange}>
                  <option value="unspecified">Prefiero no decirlo</option>
                  <option value="female">Femenino</option>
                  <option value="male">Masculino</option>
                  <option value="non_binary">No binario</option>
                </select>
              </div>
              <div className="evh-profile-field evh-profile-field-wide">
                <label htmlFor="profile-preferences">¿Qué te interesa para tu hogar?</label>
                <Select
                  inputId="profile-preferences"
                  isMulti
                  closeMenuOnSelect={false}
                  options={optionsForPreferences(formData.preferences)}
                  value={formData.preferences}
                  onChange={(selectedOptions) => setFormData((current) => ({ ...current, preferences: selectedOptions || [] }))}
                  placeholder="Selecciona una o varias categorías"
                  className="evh-profile-select"
                  classNamePrefix="evh-profile-select"
                  menuPortalTarget={typeof document === 'undefined' ? undefined : document.body}
                  styles={{ menuPortal: (base) => ({ ...base, zIndex: 10000 }) }}
                />
                <span className="evh-profile-field-hint">Estas preferencias pueden ayudarte a encontrar productos que te interesan; no te impiden explorar el catálogo completo.</span>
              </div>
            </div>
            <div className="evh-profile-actions">
              <button type="button" className="evh-button evh-button-secondary" onClick={handleCancel} disabled={saving}>Cancelar</button>
              <button type="submit" className="evh-button evh-button-primary" disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        )}
      </section>
      <p className="evh-profile-footer-note">Tus preferencias se usan para personalizar la exploración del catálogo. Puedes modificarlas cuando quieras.</p>
    </main>
  );
};

export default PerfilCliente;
