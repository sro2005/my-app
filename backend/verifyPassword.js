const bcrypt = require('bcrypt');

// Contraseña cifrada que obtuviste de tu base de datos
const hashedPassword = "$2b$10$2UZPlh3KYkJ47Ms8wZ.cOOEQvp9Bpyo6jFc44ZURJzbfSFPdhDHRW"; // Contraseña cifrada

// Contraseña sin cifrar con la que te registraste
const plainTextPassword = "CEVH2025$"; // Asegúrate de que esta es la contraseña correcta

bcrypt.compare(plainTextPassword, hashedPassword, (err, isMatch) => {
  if (err) {
    console.error('Error comparando contraseñas:', err);
  } else {
    console.log('La comparación de contraseñas resultó en:', isMatch); // true si coinciden, false si no coinciden
  }
});
