import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Select from 'react-select';
import FormPage from './FormPage';

const isAdult = (birthDate) => {
  if (!birthDate) return false;

  const [year, month, day] = birthDate.split('-').map(Number);
  if (!year || !month || !day) return false;

  const today = new Date();
  let age = today.getFullYear() - year;
  const birthdayHasNotOccurred =
    today.getMonth() + 1 < month ||
    (today.getMonth() + 1 === month && today.getDate() < day);

  if (birthdayHasNotOccurred) age -= 1;
  return age >= 18;
};

// Opciones de preferencias ordenadas alfabéticamente
const sortedOptions = [
  { value: 'Aires Acondicionados', label: 'Aires Acondicionados' },
  { value: 'Aspiradoras', label: 'Aspiradoras' },
  { value: 'Batidoras', label: 'Batidoras' },
  { value: 'Bocinas Inteligentes o Parlantes Bluetooth', label: 'Bocinas Inteligentes o Parlantes Bluetooth' },
  { value: 'Cafeteras', label: 'Cafeteras' },
  { value: 'Celulares', label: 'Celulares' },
  { value: 'Computadores de Escritorio', label: 'Computadores de Escritorio' },
  { value: 'Computadores Portátiles', label: 'Computadores Portátiles' },
  { value: 'Consolas de Videojuegos', label: 'Consolas de Videojuegos' },
  { value: 'Estufas', label: 'Estufas' },
  { value: 'Impresoras', label: 'Impresoras' },
  { value: 'Lavadoras', label: 'Lavadoras' },
  { value: 'Licuadoras', label: 'Licuadoras' },
  { value: 'Microondas', label: 'Microondas' },
  { value: 'Planchas de Ropa', label: 'Planchas de Ropa' },
  { value: 'Refrigeradores', label: 'Refrigeradores' },
  { value: 'Sandwicheras', label: 'Sandwicheras' },
  { value: 'Secadores de Cabello', label: 'Secadores de Cabello' },
  { value: 'Tablets', label: 'Tablets' },
  { value: 'Televisores', label: 'Televisores' },
  { value: 'Tostadoras', label: 'Tostadoras' },
  { value: 'Ventiladores', label: 'Ventiladores' }
];

// Opción deshabilitada que se mostrará por defecto
const defaultOption = { 
  value: "", 
  label: "SELECCIONA TUS PREFERENCIAS:", 
  isDisabled: true 
};

// Combinamos la opción deshabilitada con las opciones ordenadas
const optionsWithDefault = [defaultOption, ...sortedOptions];
const preferenceSelectStyles = {
  menuPortal: base => ({ ...base, zIndex: 10000 }),
  menuList: base => ({ ...base, maxHeight: 240, padding: '6px' })
};

const RegistroCliente = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [identificationNumber, setIdentificationNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [preferences, setPreferences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const navigate = useNavigate();

  // Validación: El número de identificación no debe exceder los 10 dígitos
  const isValidIdentification = (idNumber) => {
    const cleanValue = idNumber.replace(/[^\d]/g, '');
    return cleanValue.length <= 10;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isAdult(birthDate)) {
      setError('Debes ser mayor de 18 años para registrarte.');
      return;
    }

    if (!isValidIdentification(identificationNumber)) {
      setError('El número de identificación no puede superar los 10 dígitos.');
      return;
    }

    setLoading(true);
    setError(''); // Reset error message

    const API_URL = (process.env.REACT_APP_API_BASE_URL || '').trim().replace(/\/$/, '');
    if (!API_URL) {
      setError('El registro no está disponible en este momento. Intenta nuevamente más tarde.');
      setLoading(false);
      return;
    }

    axios.post(`${API_URL}/api/auth/register`, {
      firstName,
      lastName,
      email,
      identificationNumber,
      birthDate,
      password,
      phone,
      preferences: preferences.map(pref => pref.value)
    })
    .then(() => {
      setSuccessMessage('¡Registro exitoso! Redirigiendo...');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    })
    .catch(() => {
      // No imprimir el objeto Axios: su configuración puede contener datos personales
      // enviados en el formulario, incluida la contraseña.
      setError('Ocurrió un error al registrar al cliente. Por favor, intenta nuevamente.');
    })
    .finally(() => {
      setLoading(false);
    });
  };

  const formatIdentificationNumber = (value) => {
    let cleanValue = value.replace(/[^\d]/g, ''); // Elimina todo lo que no sea número
  
    // Limita a 10 dígitos
    if (cleanValue.length > 10) {
      cleanValue = cleanValue.slice(0, 10);
    }
  
    // Formatear con puntos
    return cleanValue
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // Este patrón agrega puntos cada 3 dígitos
  };

  // Función para formatear el número de celular (por ejemplo, insertando un espacio después de 3 dígitos)
  const formatPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, ''); // Elimina todo lo que no sea número
    if (digits.length > 10) {
      return digits.slice(0, 10); // Limita a 10 dígitos
    }
    if (digits.length > 3) {
      return digits.slice(0, 3) + ' ' + digits.slice(3, 10); // Formato 302 0000000
    }
    return digits; // Muestra el número sin formato si es menor a 3 dígitos
  };
  
  return (
    <FormPage eyebrow="EMPIEZA POR TI" title="Crea tu espacio" description="Cuéntanos un poco de ti para acercarte a los productos que hacen tu hogar más cómodo.">
    <form className="evh-form evh-register-form" onSubmit={handleSubmit}>
      <div className="evh-form-grid">
        <div className="evh-form-field">
          <label htmlFor="register-first-name">Nombre(s)</label>
          <input id="register-first-name" type="text" autoComplete="given-name" placeholder="Tu nombre" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>
        <div className="evh-form-field">
          <label htmlFor="register-last-name">Apellidos</label>
          <input id="register-last-name" type="text" autoComplete="family-name" placeholder="Tus apellidos" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
        <div className="evh-form-field evh-form-field-wide">
          <label htmlFor="register-email">Correo electrónico</label>
          <input id="register-email" type="email" autoComplete="email" placeholder="nombre@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="evh-form-field">
          <label htmlFor="register-identification">Número de identificación</label>
          <input id="register-identification" type="text" inputMode="numeric" autoComplete="off" placeholder="Ej. 1.234.567" value={identificationNumber} onChange={(e) => setIdentificationNumber(formatIdentificationNumber(e.target.value))} required />
          <span className="evh-field-hint">Hasta 10 dígitos, sin puntos al escribir.</span>
        </div>
        <div className="evh-form-field">
          <label htmlFor="birthDate">Fecha de nacimiento</label>
          <input type="date" id="birthDate" autoComplete="bday" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required />
        </div>
        <div className="evh-form-field">
          <label htmlFor="register-phone">Celular</label>
          <div className="evh-phone-field">
            <span aria-hidden="true">+57</span>
            <input id="register-phone" type="tel" autoComplete="tel-national" inputMode="numeric" placeholder="302 000 0000" value={phone} onChange={(e) => setPhone(formatPhoneNumber(e.target.value))} required />
          </div>
        </div>
        <div className="evh-form-field">
          <label htmlFor="register-password">Contraseña</label>
          <input id="register-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,128}" title="Incluye mayúscula, minúscula, número y símbolo." value={password} onChange={(e) => setPassword(e.target.value)} required />
          <span className="evh-field-hint">8 caracteres, mayúscula, minúscula, número y símbolo.</span>
        </div>
        <div className="evh-form-field evh-form-field-wide">
          <label htmlFor="preferences">¿Qué te interesa para tu hogar?</label>
          <Select inputId="preferences" isMulti options={optionsWithDefault.filter(option => option.value)} value={preferences} onChange={setPreferences} placeholder="Elige una o varias categorías" className="select-preferences" classNamePrefix="evh-select" menuPortalTarget={document.body} menuPosition="fixed" styles={preferenceSelectStyles} />
        </div>
      </div>
      <button className="evh-form-submit" type="submit" disabled={loading}>
        {loading ? 'Creando tu cuenta…' : 'Crear mi cuenta'}
      </button>
      {loading && <div className="evh-form-feedback" role="status">Preparando tu espacio…</div>}
      {error && <div className="evh-form-feedback is-error" role="alert">{error}</div>}
      {successMessage && <div className="evh-form-feedback is-success" role="status">{successMessage}</div>}
    </form>
    <p className="evh-form-alternate">¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link></p>
    </FormPage>
  );
};

export default RegistroCliente;
