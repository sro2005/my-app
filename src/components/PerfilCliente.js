import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Componente funcional PerfilCliente para mostrar el perfil del cliente
const PerfilCliente = () => {
  // Estado para almacenar la información del cliente
  const [customer, setCustomer] = useState(null);

  // Efecto de efecto secundario para obtener los datos del cliente al montar el componente
  useEffect(() => {
    axios.get('/api/customer') // Petición GET para obtener los datos del cliente desde la API
      .then(response => {
        setCustomer(response.data); // Almacenar los datos del cliente en el estado local
      })
      .catch(error => {
        console.error('Error obteniendo perfil:', error); // Manejar errores si la petición falla
      });
  }, []); // El segundo argumento de useEffect [] asegura que se ejecute solo una vez al montar el componente

  // Si el cliente aún no se ha cargado, mostrar un mensaje de carga
  if (!customer) return <p>Cargando...</p>;

  // Renderizado del perfil del cliente una vez que los datos están disponibles
  return (
    <div>
      <h2>Perfil de Cliente</h2>
      <p>Nombre: {customer.firstName} {customer.lastName}</p>
      <p>Correo Electrónico: {customer.email}</p>
      <p>Fecha de Nacimiento: {customer.birthDate}</p>
      <p>Dirección: {customer.address}</p>
      <p>Teléfono: {customer.phone}</p>
      <p>Preferencias: {customer.preferences}</p>
    </div>
  );
};

// Exportar el componente PerfilCliente para su uso en otros archivos
export default PerfilCliente;

