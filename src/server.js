const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());

// Rutas
app.post('/api/customers', (req, res) => {
  // Aquí iría la lógica para registrar un cliente
  const newCustomer = req.body;
  // Guardar nuevo cliente en la base de datos (lógica simulada aquí)
  res.status(201).json({ message: 'Cliente registrado exitosamente', newCustomer });
});

app.post('/api/login', (req, res) => {
  // Aquí iría la lógica para iniciar sesión de un cliente
  const credentials = req.body;
  // Validar credenciales (lógica simulada aquí)
  if (credentials.email === 'santiagor.o06105@gmail.com' && credentials.password === 'SantiagoRO2024$') {
    res.status(200).json({ message: 'Inicio de sesión exitoso', token: 'fake-jwt-token' });
  } else {
    res.status(401).json({ message: 'Credenciales incorrectas' });
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
