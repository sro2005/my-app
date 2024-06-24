import React, { useState } from 'react';
import axios from 'axios';

// Componente funcional RegistroCliente para registrar nuevos clientes
const RegistroCliente = () => {
  // Estado para almacenar los datos del cliente que se va a registrar
  const [customer, setCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    birthDate: '',
    password: '',
    confirmPassword: '',
    address: '',
    phone: '',
    preferences: ''
  });

  // Función para manejar cambios en los campos del formulario
  const handleChange = (e) => {
    setCustomer({ ...customer, [e.target.name]: e.target.value });
  };

  // Función para manejar el envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validación de contraseñas
    if (customer.password !== customer.confirmPassword) {
      alert('Las contraseñas no coinciden!');
      return;
    }

    // Petición POST para enviar los datos del cliente a la API
    axios.post('/api/customers', customer)
      .then(response => {
        console.log('Cliente registrado:', response.data); // Mostrar mensaje de éxito en la consola
      })
      .catch(error => {
        console.error('Error registrando cliente:', error); // Manejar errores si la petición falla
      });
  };

  // Renderizado del formulario de registro de cliente
  return (
    <form onSubmit={handleSubmit}>
      <input type="text" name="firstName" placeholder="Nombres" onChange={handleChange} required />
      <input type="text" name="lastName" placeholder="Apellidos" onChange={handleChange} required />
      <input type="email" name="email" placeholder="Correo Electrónico" onChange={handleChange} required />
      <input type="date" name="birthDate" placeholder="Fecha de Nacimiento" onChange={handleChange} required />
      <input type="password" name="password" placeholder="Contraseña" onChange={handleChange} required />
      <input type="password" name="confirmPassword" placeholder="Confirmar Contraseña" onChange={handleChange} required />
      <input type="text" name="address" placeholder="Dirección" onChange={handleChange} required />
      <input type="tel" name="phone" placeholder="Teléfono" onChange={handleChange} required />
      <input type="text" name="preferences" placeholder="Preferencias de Productos" onChange={handleChange} required />
      <button type="submit">Registrar</button>
    </form>
  );
};

// Exportar el componente RegistroCliente para su uso en otros archivos
export default RegistroCliente;

