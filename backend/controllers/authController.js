const bcrypt = require('bcrypt');
const Customer = require('../models/Customer');
const { registerOrUpdateLoginLog } = require('../models/LoginLog');
const { generateToken } = require('../utils/tokenUtils');

// Función para formatear el número de teléfono
const formatPhoneNumber = (value) => {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('57')) {
    digits = digits.slice(2);
  }
  digits = digits.slice(0, 10);
  if (digits.length > 3) {
    return `+57 ${digits.slice(0, 3)} ${digits.slice(3)}`;
  }
  return `+57 ${digits}`;
};

// Función genérica para registrar usuarios
const registerUser = async (req, res, role) => {
  try {
    console.log(`Datos recibidos para registrar ${role}:`, req.body);
    const {
      firstName,
      lastName,
      email,
      identificationNumber,
      birthDate,
      password,
      phone,
      preferences
    } = req.body;

    // Verificar si el correo ya está registrado
    const existingUser = await Customer.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    // Crear el objeto de datos para el nuevo usuario
    const newUserData = {
      email,
      password: hashedPassword,
      role
    };

    // Si se trata de un usuario (cliente), agregar los demás campos
    if (role === 'user') {
      newUserData.firstName = firstName;
      newUserData.lastName = lastName;
      newUserData.identificationNumber = identificationNumber;
      newUserData.birthDate = birthDate;
      newUserData.phone = formatPhoneNumber(phone);
      newUserData.preferences = preferences;
    }

    const newUser = new Customer(newUserData);

    await newUser.save();
    res.status(201).json({
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully`
    });
  } catch (error) {
    console.error(`Error en el registro de ${role}:`, error);
    res.status(400).json({ message: `Error registering ${role}`, error: error.message });
  }
};

// Registro de un cliente (usuario normal)
exports.registerCustomer = (req, res) => registerUser(req, res, 'user');

// Registro de un administrador
exports.registerAdmin = (req, res) => registerUser(req, res, 'admin');

// Inicio de sesión de un usuario (cliente o admin)
exports.loginCustomer = async (req, res) => {
  const { email, password, role } = req.body; // Se puede enviar role opcionalmente desde el frontend

  try {
    // Buscar al usuario por correo
    const user = await Customer.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Incorrect email or password' });
    }

    // Comparar la contraseña
    const isMatch = await bcrypt.compare(password.trim(), user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect email or password' });
    }

    // Si se envía un rol, verificar que coincida con el rol del usuario
    if (role && user.role !== role) {
      return res.status(403).json({
        message: `Access denied. Expected ${role}, but got ${user.role}`
      });
    }

    // Actualizar el estado y la última actividad
    user.status = "Active";
    user.lastActivityDate = new Date();
    await user.save();

    // Registrar el intento de inicio de sesión
    await registerOrUpdateLoginLog(user);

    // Generar el token JWT con el payload que incluye role
    const token = generateToken(user);
    return res.status(200).json({ token, user, message: 'Login successful' });
  } catch (error) {
    console.error('Error en el inicio de sesión:', error.message);
    res.status(400).json({ message: 'Error logging in', error: error.message });
  }
};