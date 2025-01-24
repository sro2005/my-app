const jwt = require('jsonwebtoken');
const dotenv = require('dotenv'); 
dotenv.config(); // Cargar las variables de entorno desde el archivo .env

const secretKey = process.env.JWT_SECRET; // Utiliza JWT_SECRET para obtener la clave secreta

const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    console.error("Token no proporcionado");
    return res.status(401).json({ message: 'No autenticado, por favor proporciona un token' });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Error verificando el token:", error);
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    console.error("Acceso denegado: no es administrador");
    return res.status(403).json({ message: 'No autorizado, acceso reservado para administradores' });
  }
  next();
};

// Middleware para el manejo centralizado de errores
const errorHandler = (err, req, res, next) => {
  console.error("Error interno del servidor:", err.stack);
  res.status(500).json({ message: 'Ocurrió un error interno del servidor' });
};

module.exports = { authenticate, authorizeAdmin, errorHandler };
