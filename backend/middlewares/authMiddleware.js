const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config(); // Cargar las variables de entorno desde el archivo .env

const secretKey = process.env.JWT_SECRET;

// Middleware para autenticar solo administradores
const authenticateAdminToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No autenticado, por favor proporciona un token' });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado: no tiene el rol de administrador' });
    }

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

module.exports = { authenticateAdminToken };


