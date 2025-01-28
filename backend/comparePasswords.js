const bcrypt = require('bcryptjs');

const originalPassword = 'CompanyEVH2025';
const hashFromDatabase = '$2a$10$D7kOEOBQ/7vw4azYrk5VnOUdTetzEh6hWa4y2c15WaE/EB/1ownoW'; // El hash generado

bcrypt.compare(originalPassword, hashFromDatabase, (err, result) => {
  if (err) {
    console.log('Error en la comparación de contraseñas', err);
  } else {
    console.log('Resultado de la comparación:', result); // Esperado: true si las contraseñas coinciden
  }
});
