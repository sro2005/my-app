const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config(); // Cargar las variables de entorno desde el archivo .env

// Asegurarse de que la variable JWT_SECRET esté definida en .env
const secretKey = process.env.JWT_SECRET;
if (!secretKey) {
  console.error("Falta la variable de entorno JWT_SECRET");
  process.exit(1); // Termina el proceso si no se encuentra la clave secreta
}

// Middleware para autenticar solo administradores
const authenticateAdminToken = (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ message: 'No autenticado, por favor proporciona un token' });
  }

  // Extraer el token del encabezado Authorization
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token no encontrado, por favor proporciona un token válido' });
  }

  try {
    // Verificar el token usando la clave secreta
    const decoded = jwt.verify(token, secretKey);

    // Verificar si el rol es 'admin'
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado: no tiene el rol de administrador' });
    }

    // Guardar los datos decodificados en el objeto req para que puedan ser usados en otros middlewares o controladores
    req.user = decoded;
    next(); // Continuar con la ejecución del siguiente middleware o controlador
  } catch (error) {
    console.error("Error verificando el token:", error);

    // Manejar los diferentes tipos de errores de JWT
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Token inválido' });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Token expirado' });
    }

    // En caso de otros errores, retornar un error genérico
    return res.status(500).json({ message: 'Error interno del servidor al verificar el token' });
  }
};

module.exports = { authenticateAdminToken };



