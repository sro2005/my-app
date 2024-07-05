// server.js

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Conexión a MongoDB
mongoose.connect('mongodb://localhost:27017/my-app-db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Error de conexión MongoDB:'));
db.once('open', () => {
  console.log('Conexión exitosa a MongoDB');
});

// Rutas API
const customerRouter = require('./routes/customerRoutes'); // Definir tus rutas aquí
const authRouter = require('./routes/authRoutes'); // Definir rutas de autenticación aquí
app.use('/api/customers', customerRouter);
app.use('/api/auth', authRouter);

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor backend corriendo en http://localhost:${port}`);
});
