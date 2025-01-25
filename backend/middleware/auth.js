const jwt = require('jsonwebtoken');
const dotenv = require('dotenv'); 
dotenv.config(); // Cargar las variables de entorno desde el archivo .env

const secretKey = process.env.JWT_SECRET;

const authenticateToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1];

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

const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      console.error("Acceso denegado: no tiene el rol adecuado");
      return res.status(403).json({ message: 'No autorizado, acceso reservado para ciertos roles' });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRole };
