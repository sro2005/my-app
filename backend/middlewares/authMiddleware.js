const jwt = require('jsonwebtoken');
require('dotenv').config(); // Cargar variables de entorno

const secretKey = process.env.JWT_SECRET;
if (!secretKey) {
  console.error("Falta la variable de entorno JWT_SECRET");
  process.exit(1);
}

// Middleware genérico para autenticar cualquier usuario
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado: Token no proporcionado' });
  }

  try {
    req.user = jwt.verify(token, secretKey);
    next();
  } catch (error) {
    return res.status(401).json({
      message: error instanceof jwt.TokenExpiredError
        ? 'Token expirado'
        : 'Token inválido',
    });
  }
};

// Middleware para autenticar solo administradores
const authenticateAdminToken = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado: Requiere rol de administrador' });
    }
    next();
  });
};

module.exports = { authenticateToken, authenticateAdminToken };