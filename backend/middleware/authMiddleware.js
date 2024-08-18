const jwt = require('jsonwebtoken');

// Clave secreta para la firma de los tokens JWT
const JWT_SECRET = process.env.JWT_SECRET || 'Th1s!s@V3ry$ecur3&Uniqu3K3y#2024!';

// Middleware para autenticación: verifica el token JWT en la cabecera Authorization
exports.authenticateToken = (req, res, next) => {
  // Obtener el token de la cabecera Authorization
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // Verificar si el token está presente
  if (!token) {
    return res.status(401).json({ message: 'Acceso denegado, token no proporcionado' });
  }

  try {
    // Verificar el token usando la clave secreta
    const decoded = jwt.verify(token, JWT_SECRET);
    // Adjuntar la información decodificada del token al objeto req
    req.user = decoded;
    next();
  } catch (error) {
    // Manejar errores de verificación del token
    res.status(401).json({ message: 'Token inválido' });
  }
};

// Middleware para autorización: verifica si el usuario tiene uno de los roles permitidos
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // Verificar si el rol del usuario está en la lista de roles permitidos
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acceso denegado, no tienes permiso' });
    }
    next();
  };
};
