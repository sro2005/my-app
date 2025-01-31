import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Select from 'react-select';
import PhoneInput from 'react-phone-number-input';
import { isValidPhoneNumber, formatPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

const isAdult = (birthDate) => {
  const today = new Date();
  const birthDateObj = new Date(birthDate);
  const age = today.getFullYear() - birthDateObj.getFullYear();
  return age >= 18 || (age === 18 && today.getMonth() >= birthDateObj.getMonth());
};

const options = [
  { value: 'Refrigeradores', label: 'Refrigeradores' },
  { value: 'Estufas', label: 'Estufas' },
  { value: 'Microondas', label: 'Microondas' },
  { value: 'Lavadoras', label: 'Lavadoras' },
  { value: 'Aspiradoras', label: 'Aspiradoras' },
  { value: 'Aires acondicionados', label: 'Aires acondicionados' },
  { value: 'Sandwicheras', label: 'Sandwicheras' },
  { value: 'Televisores', label: 'Televisores' },
  { value: 'Secadores de cabello', label: 'Secadores de cabello' },
  { value: 'Planchas de ropa', label: 'Planchas de ropa' },
  { value: 'Cafeteras', label: 'Cafeteras' },
  { value: 'Computadores de Escritorio', label: 'Computadores de Escritorio' },
  { value: 'Computadores Portátiles', label: 'Computadores Portátiles' },
  { value: 'Tabletas/Tablets', label: 'Tabletas/Tablets' },
  { value: 'Impresoras', label: 'Impresoras' },
  { value: 'Consola de Videojuegos', label: 'Consola de Videojuegos' },
  { value: 'Bocinas inteligentes o parlantes Bluetooth', label: 'Bocinas inteligentes o parlantes Bluetooth' },
  { value: 'Celulares', label: 'Celulares' },
  { value: 'Tostadoras', label: 'Tostadoras' },
  { value: 'Batidoras', label: 'Batidoras' },
  { value: 'Hornos', label: 'Hornos' },
  { value: 'Licuadoras', label: 'Licuadoras' },
  { value: 'Ventiladores', label: 'Ventiladores' }
];

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

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isAdult(birthDate)) {
      setError('Debes ser mayor de 18 años para registrarte.');
      return;
    }

    setLoading(true);
    setError(''); // Reset error message

  // Formatear el número de teléfono y verificar su validez
  const formattedPhone = phone ? formatPhoneNumber(phone) : ''; 
    if (!isValidPhoneNumber(formattedPhone)) {
      setLoading(false);
      return;
    }

    const API_URL = process.env.REACT_APP_API_BASE_URL || 'https://localhost:5000';

    axios.post(`${API_URL}/api/auth/register`, {
      firstName,
      lastName,
      email,
      identificationNumber,
      birthDate,
      password,
      phone: formattedPhone, // Usar el número de teléfono formateado
      preferences: preferences.map(pref => pref.value)
    })
    .then(response => {
      setLoading(false);
      navigate('/login');
    })
    .catch(error => {
      setLoading(false);
      setError('Ocurrió un error al registrar al cliente. Por favor, intenta nuevamente.');
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>CREAR CUENTA</h1>
      <h2>Registro del Cliente</h2>
      <input type="text" placeholder="Nombre(s)" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
      <input type="text" placeholder="Apellidos" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
      <input type="email" placeholder="Correo Electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="text" placeholder="Número de Identificación (Cédula de Ciudadanía)" value={identificationNumber} onChange={(e) => setIdentificationNumber(e.target.value)} required />
      <div>
        <label htmlFor="birthDate">Fecha de Nacimiento:</label>
        <input type="date" id="birthDate" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required />
      </div>
      <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <PhoneInput international defaultCountry="CO" value={phone} onChange={setPhone} placeholder="Número de Celular" required />
      <div>
        <label htmlFor="preferences">Preferencias de Productos:</label>
        <Select id="preferences" isMulti options={options} value={preferences} onChange={setPreferences} placeholder="Selecciona tus preferencias" className="select-preferences" />
      </div>
      <button type="submit">Registrar</button>
      {loading && <div className="spinner">Procesando...</div>}
      {error && <div className="error-message">{error}</div>} {/* Mensaje de error */}
    </form>
  );
};

export default RegistroCliente;