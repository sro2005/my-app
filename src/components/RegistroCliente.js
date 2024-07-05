// src/components/RegistroCliente.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

    // Lógica de registro aquí
    // Puedes usar axios para enviar los datos a tu servidor
    // Ejemplo:
    /*
    axios.post('/api/customers', {
      firstName,
      lastName,
      email,
      birthDate,
      password,
      address,
      phone,
      preferences
    })
    .then(response => {
      console.log('Cliente registrado:', response.data);
      // Redirigir al formulario de inicio de sesión después de un registro exitoso
      navigate('/login');
    })
    .catch(error => {
      console.error('Error registrando cliente:', error);
      alert('Ocurrió un error al registrar al cliente. Por favor, intenta nuevamente.');
    });
    */

    // Simulación de registro exitoso
    alert('¡Registro exitoso!');
    navigate('/login');
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>CREAR CUENTA</h1>
      <h2>Registro del Cliente</h2>
      <input type="text" placeholder="Nombres" value={firstName} onChange={(e) => setFirstName(e.target.value)}/>
      <input type="text" placeholder="Apellidos" value={lastName} onChange={(e) => setLastName(e.target.value)}/>
      <input type="email" placeholder="Correo Electrónico" value={email} onChange={(e) => setEmail(e.target.value)}/>
      <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}/>
      <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)}/>
      <input type="password" placeholder="Confirmar Contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}/>
      <input type="text" placeholder="Dirección del domicilio" value={address} onChange={(e) => setAddress(e.target.value)}/>
      <input type="tel" placeholder="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)}/>
      <input type="text" placeholder="Preferencias de Productos" value={preferences} onChange={(e) => setPreferences(e.target.value)}/>
      <button type="submit">Registrar</button>
    </form>
  );
};

export default RegistroCliente;
