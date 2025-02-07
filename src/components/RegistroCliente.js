import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Select from 'react-select';

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
  { value: 'Aires Acondicionados', label: 'Aires Acondicionados' },
  { value: 'Sandwicheras', label: 'Sandwicheras' },
  { value: 'Televisores', label: 'Televisores' },
  { value: 'Secadores de Cabello', label: 'Secadores de Cabello' },
  { value: 'Planchas de Ropa', label: 'Planchas de Ropa' },
  { value: 'Cafeteras', label: 'Cafeteras' },
  { value: 'Computadores de Escritorio', label: 'Computadores de Escritorio' },
  { value: 'Computadores Portátiles', label: 'Computadores Portátiles' },
  { value: 'Tabletas/Tablets', label: 'Tabletas/Tablets' },
  { value: 'Impresoras', label: 'Impresoras' },
  { value: 'Consola de Videojuegos', label: 'Consola de Videojuegos' },
  { value: 'Bocinas Inteligentes o Parlantes Bluetooth', label: 'Bocinas Inteligentes o Parlantes Bluetooth' },
  { value: 'Celulares', label: 'Celulares' },
  { value: 'Tostadoras', label: 'Tostadoras' },
  { value: 'Batidoras', label: 'Batidoras' },
  { value: 'Hornos', label: 'Hornos' },
  { value: 'Licuadoras', label: 'Licuadoras' },
  { value: 'Ventiladores', label: 'Ventiladores' }
];

// Ordenar las opciones alfabéticamente por el label
const sortedOptions = options.sort((a, b) => a.label.localeCompare(b.label));

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

  // Validación para asegurarse de que el número de identificación no exceda los 10 dígitos
  const isValidIdentification = (idNumber) => {
    const cleanValue = idNumber.replace(/[^\d]/g, ''); // Elimina los puntos antes de validar
    return cleanValue.length <= 10;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isAdult(birthDate)) {
      setError('Debes ser mayor de 18 años para registrarte.');
      return;
    }

    if (!isValidIdentification(identificationNumber)) {
      setError('El número de identificación debe ser de 10 dígitos.');
      return;
    }

    setLoading(true);
    setError(''); // Reset error message

    const API_URL = process.env.REACT_APP_API_BASE_URL || 'https://localhost:5000';

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
    .then(response => {
      console.log('Cliente registrado:', response.data); // Verifica la respuesta
      setSuccessMessage('¡Registro exitoso! Redirigiendo...');
      setTimeout(() => {
        navigate('/login'); // Redirigir después de 2 segundos
      }, 3000);
    })
    .catch(error => {
      console.error('Error registrando cliente', error); // Verifica el error en caso de fallo
      setError('Ocurrió un error al registrar al cliente. Por favor, intenta nuevamente.');
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
    <form onSubmit={handleSubmit}>
      <h1>CREAR CUENTA</h1>
      <h2>Registro del Cliente</h2>
      <input type="text" placeholder="Nombre(s)" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
      <input type="text" placeholder="Apellidos" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
      <input type="email" placeholder="Correo Electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="text" placeholder="Número de Identificación (Cédula de Ciudadanía)" value={identificationNumber} onChange={(e) => setIdentificationNumber(formatIdentificationNumber(e.target.value))}  required />
      <div>
        <label htmlFor="birthDate">Fecha de Nacimiento:</label>
        <input type="date" id="birthDate" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required />
      </div>
      <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <div className="phone-input-wrapper">
        <div className="phone-input-prefix">+57</div>
        <input type="text" className="phone-input-field" placeholder="Número de Celular" value={phone} onChange={(e) => setPhone(formatPhoneNumber(e.target.value))} required />
      </div>
      <div>
        <label htmlFor="preferences">Preferencias de Productos:</label>
        <Select 
          id="preferences" 
          isMulti 
          options={sortedOptions} // Usamos las opciones ordenadas
          value={preferences} 
          onChange={setPreferences} 
          placeholder="Selecciona tus preferencias" 
          className="select-preferences" 
        />
      </div>
      <button type="submit">Registrar</button>
      {loading && <div className="spinner">Procesando...</div>}
      {error && <div className="error-message">{error}</div>} {/* Mensaje de error */}
      {successMessage && <div className="success-message">{successMessage}</div>} {/* Mensaje de éxito */}
    </form>
  );
};

export default RegistroCliente;