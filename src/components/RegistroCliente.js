// src/components/RegistroCliente.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const RegistroCliente = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [preferences, setPreferences] = useState('');

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden!');
      return;
    }

    // Enviar datos al backend usando Axios
    axios.post('/api/customers/register', {
      firstName,
      lastName,
      email,
      birthDate,
      password,
      address,
      phone,
      preferences: preferences.split(',')
    })
    .then(response => {
      console.log('Cliente registrado:', response.data);
      alert('¡Registro exitoso!');
      navigate('/login');
    })
    .catch(error => {
      console.error('Error registrando cliente:', error);
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
      <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required />
      <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <input type="password" placeholder="Confirmar Contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
      <input type="text" placeholder="Dirección del Domicilio" value={address} onChange={(e) => setAddress(e.target.value)} required />
      <input type="tel" placeholder="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      <input type="text" placeholder="Preferencias de Productos" value={preferences} onChange={(e) => setPreferences(e.target.value)} required />
      <button type="submit">Registrar</button>
    </form>
  );
};

export default RegistroCliente;
