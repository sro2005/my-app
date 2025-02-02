const bcrypt = require('bcrypt');
const Customer = require('../models/Customer');
const { registerOrUpdateLoginLog } = require('../models/LoginLog');
const { generateToken } = require('../utils/tokenUtils');

// Función genérica para registrar usuarios
const registerUser = async (req, res, role) => {
  try {
    console.log(`Datos recibidos para registrar ${role}:`, req.body);
    const { firstName, lastName, email, password, identificationNumber, birthDate, phone, preferences } = req.body;

    // Verificar si el correo ya está registrado
    const existingUser = await Customer.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    // Crear nuevo usuario
    const newUser = new Customer({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      ...(role === 'user' && { identificationNumber, birthDate, phone, preferences }), // Solo agregar estos datos si es usuario
    });

    await newUser.save();
    res.status(201).json({ message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully` });
  } catch (error) {
    console.error(`Error en el registro de ${role}:`, error);
    res.status(400).json({ message: `Error registering ${role}`, error: error.message });
  }
};

// Registro de un cliente
exports.registerCustomer = (req, res) => registerUser(req, res, 'user');

// Registro de un administrador
exports.registerAdmin = (req, res) => registerUser(req, res, 'admin');

// Inicio de sesión de un usuario (cliente o admin)
exports.loginCustomer = async (req, res) => {
  const { email, password } = req.body; // No aplicar trim aquí

  try {
    const user = await Customer.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Incorrect email or password' });
    }

    // Comparar contraseña
    const isMatch = await bcrypt.compare(password.trim(), user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect email or password' });
    }

    // Activar usuario y actualizar última actividad
    user.status = "Active";
    user.lastActivityDate = new Date();
    await user.save();

    // Registrar el intento de inicio de sesión
    await registerOrUpdateLoginLog(user);

    // Generar token de autenticación
    const token = generateToken(user);
    return res.status(200).json({ token, user, role: user.role, message: 'Login successful' });

  } catch (error) {
    console.error('Error en el inicio de sesión:', error.message);
    res.status(400).json({ message: 'Error logging in', error: error.message });
  }
};
