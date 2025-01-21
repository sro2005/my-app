const jwt = require('jsonwebtoken');
require('dotenv').config(); // Cargar las variables de entorno desde el archivo .env

const secretKey = process.env.JWT_SECRET; // Utiliza JWT_SECRET para obtener la clave secreta

const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};

const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'No autorizado' });
  }
  next();
};

module.exports = { authenticate, authorizeAdmin };
