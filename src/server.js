const express = require('express');
const app = express();
const port = 5000;

// Middleware para parsear JSON
app.use(express.json());

// Rutas API
app.get('/api/data', (req, res) => {
  res.json({ message: 'Datos desde el servidor' });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor backend corriendo en http://localhost:${port}`);
});
