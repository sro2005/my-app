// Importar los módulos necesarios
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Crear una instancia de Express
const app = express();

// Middleware para parsear JSON y permitir CORS
app.use(bodyParser.json());
app.use(cors());

// Definir las rutas API
app.get('/', (req, res) => {
  res.send('API Funcionando'); // Ruta principal
});

// Rutas para los endpoints específicos
app.use('/api/producto-form', require('./routes/productoForm'));
app.use('/api/pedido-form', require('./routes/pedidoForm'));
app.use('/api/confirmacion-pedido', require('./routes/confirmacionPedido'));
app.use('/api/listado-clientes', require('./routes/listadoClientes'));
app.use('/api/listado-productos', require('./routes/listadoProductos'));
app.use('/api/listado-pedidos', require('./routes/listadoPedidos'));
app.use('/api/registro-cliente', require('./routes/registroCliente'));
app.use('/api/login-cliente', require('./routes/loginCliente'));
app.use('/api/perfil-cliente', require('./routes/perfilCliente'));

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor iniciado en el puerto ${PORT}`);
});
