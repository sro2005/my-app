const bcrypt = require('bcrypt');

// Contraseña cifrada que obtuviste de tu base de datos
const hashedPassword = "$2b$10$wN8/B4cetm0IoUh/POVMhO6ebx8LESysmPAHzXzqNZDdebGdn08qC";

// Contraseña sin cifrar con la que te registraste
const plainTextPassword = "COMPANY_EVH2025$";

bcrypt.compare(plainTextPassword, hashedPassword, (err, isMatch) => {
  if (err) {
    console.error(err);
  } else {
    console.log(isMatch); // true si coinciden, false si no coinciden
  }
});
