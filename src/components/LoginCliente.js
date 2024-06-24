import React, { useState } from 'react';
import axios from 'axios';

// Componente funcional LoginCliente para el formulario de inicio de sesión de cliente
const LoginCliente = () => {
  // Estado para almacenar las credenciales del cliente (email y contraseña)
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });

  // Función para manejar cambios en los campos del formulario
  const handleChange = (e) => {
    // Actualizar el estado de credentials con los valores ingresados
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  // Función para manejar el envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevenir comportamiento por defecto del formulario

    // Petición POST a la API para iniciar sesión con las credenciales actuales
    axios.post('/api/login', credentials)
      .then(response => {
        // Manejar la respuesta exitosa de la API (cliente logueado)
        console.log('Cliente logueado:', response.data);
      })
      .catch(error => {
        // Manejar errores en caso de que falle la petición POST
        console.error('Error iniciando sesión:', error);
      });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Campo de correo electrónico */}
      <input type="email" name="email" placeholder="Correo Electrónico" onChange={handleChange} required />

      {/* Campo de contraseña */}
      <input type="password" name="password" placeholder="Contraseña" onChange={handleChange} required />

      {/* Botón para enviar el formulario */}
      <button type="submit">Iniciar Sesión</button>
    </form>
  );
};

// Exportar el componente LoginCliente para que pueda ser utilizado en otros archivos
export default LoginCliente;

