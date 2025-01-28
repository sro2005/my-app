const jwt = require('jsonwebtoken');

// Función para generar el token JWT
exports.generateToken = (user) => {
  try {
    const payload = { id: user._id, email: user.email, role: user.role };
    // Generamos el token con la clave secreta
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  } catch (error) {
    console.error('Error al generar el token:', error);
    throw new Error('No se pudo generar el token');
  }
};
