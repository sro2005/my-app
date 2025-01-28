import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Select from 'react-select';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css'; // Importa los estilos de la librería

// Función para verificar si el cliente es mayor de 18 años
const isAdult = (birthDate) => {
  const today = new Date();
  const birthDateObj = new Date(birthDate);
  let age = today.getFullYear() - birthDateObj.getFullYear();
  const month = today.getMonth() - birthDateObj.getMonth();

  // Ajuste de edad si el cumpleaños no ha pasado aún este año
  if (month < 0 || (month === 0 && today.getDate() < birthDateObj.getDate())) {
    age--;
  }

  return age >= 18;
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

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // Verificación de edad
    if (!isAdult(birthDate)) {
      alert('Debes ser mayor de 18 años para registrarte.');
      return;
    }

    setLoading(true);

    // Obtener la URL base de la variable de entorno
    const API_URL = process.env.REACT_APP_API_BASE_URL || 'https://localhost:5000';
    if (!API_URL) {
      console.warn('La variable REACT_APP_API_BASE_URL no está configurada.');
    }

    // Enviar datos al backend usando Axios
    axios.post(`${API_URL}/api/auth/register`, {
      firstName,
      lastName,
      email,
      identificationNumber,
      birthDate,
      password,
      phone,
      preferences: preferences.map(pref => pref.value) // Enviar los valores de las preferencias
    })
    .then(response => {
      console.log('Cliente registrado:', response.data);
      setLoading(false);
      alert('¡Registro exitoso!');
      navigate('/login');
    })
    .catch(error => {
      console.error('Error registrando cliente:', error);
      setLoading(false);
      alert('Ocurrió un error al registrar al cliente. Por favor, intenta nuevamente.');
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
      <PhoneInput placeholder="Número de Celular" value={phone} onChange={setPhone} defaultCountry="CO" required />
      
      <div>
        <label htmlFor="preferences">Preferencias de Productos:</label>
        <Select id="preferences" isMulti options={options} value={preferences} onChange={setPreferences} placeholder="Selecciona tus preferencias" className="select-preferences" />
      </div>
      <button type="submit">Registrar</button>
      {loading && <div className="spinner">Procesando...</div>} {/* Mostrar un spinner mientras se procesa el registro */}
    </form>
  );
};

export default RegistroCliente;
