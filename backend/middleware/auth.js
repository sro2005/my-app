const jwt = require('jsonwebtoken');
const dotenv = require('dotenv'); 
dotenv.config(); // Cargar las variables de entorno desde el archivo .env

const secretKey = process.env.JWT_SECRET;

const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    console.error("Token no proporcionado");
    return res.status(401).json({ message: 'No autenticado, por favor proporciona un token' });
  }

  try {
    console.log("Token recibido:", token); // Log para depuración
    const decoded = jwt.verify(token, secretKey);
    console.log("Token decodificado:", decoded); // Log para depuración

    req.user = decoded;
    next();
  } catch (error) {
    console.error("Error verificando el token:", error);

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Token inválido' });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token expirado' });
    }
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    console.error("Acceso denegado: no es administrador");
    return res.status(403).json({ message: 'No autorizado, acceso reservado para administradores' });
  }
  next();
};

module.exports = { authenticate, authorizeAdmin };

