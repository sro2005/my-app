const bcrypt = require('bcrypt');
const Customer = require('../models/Customer');
const { registerOrUpdateLoginLog } = require('../models/LoginLog');
const { generateToken } = require('../utils/tokenUtils');
const { registerSchema } = require('../validations/customerValidation');
const { isAdult, toColombianCalendarDate } = require('../utils/ageValidation');

// Función para formatear el número de teléfono
const formatPhoneNumber = (value) => {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('57')) digits = digits.slice(2);
  digits = digits.slice(0, 10);
  if (digits.length > 3) return `+57 ${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `+57 ${digits}`;
};



// Registro de cliente con validación del lado del servidor (no se confía en el formulario web).
const registerUser = async (req, res, role) => {
  try {
    const payload = { ...(req.body || {}), role };
    const { error, value } = registerSchema.validate(payload, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({
        message: 'Datos de registro inválidos.',
        errors: error.details.map((detail) => detail.message)
      });
    }

    const email = value.email.trim().toLowerCase();
    const password = value.password;
    if (role === 'user' && !isAdult(value.birthDate)) {
      return res.status(400).json({ message: 'Debes tener al menos 18 años para registrarte.' });
    }

    const existingUser = await Customer.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'No se pudo completar el registro con esos datos.' });
    }

    const newUserData = { email, password: await bcrypt.hash(password, 12), role };
    if (role === 'user') {
      newUserData.firstName = value.firstName.trim();
      newUserData.lastName = value.lastName.trim();
      newUserData.identificationNumber = value.identificationNumber.trim();
      newUserData.birthDate = toColombianCalendarDate(value.birthDate);
      newUserData.phone = formatPhoneNumber(value.phone);
      newUserData.preferences = value.preferences || [];
    }

    const newUser = new Customer(newUserData);
    await newUser.save();
    return res.status(201).json({ message: 'Registro completado correctamente.' });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'No se pudo completar el registro con esos datos.' });
    }
    console.error('Error procesando registro:', error.message);
    return res.status(500).json({ message: 'No fue posible completar el registro.' });
  }
};

exports.isAdult = isAdult;
exports.formatPhoneNumber = formatPhoneNumber;
exports.registerCustomer = (req, res) => registerUser(req, res, 'user');

// Inicio de sesión de cliente o administrador
exports.loginCustomer = async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const role = req.body?.role;

  if (!email || !password || password.length > 128) {
    return res.status(400).json({ message: 'Correo o contraseña incorrectos.' });
  }

  try {
    const user = await Customer.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos.' });
    }
    if (role && user.role !== role) {
      return res.status(403).json({ message: 'No tienes permiso para acceder con ese perfil.' });
    }

    user.status = 'Active';
    user.lastActivityDate = new Date();
    await user.save();
    await registerOrUpdateLoginLog(user);

    const token = generateToken(user);
    return res.status(200).json({ token, user, message: 'Inicio de sesión correcto.' });
  } catch (error) {
    console.error('Error procesando inicio de sesión:', error.message);
    return res.status(500).json({ message: 'No fue posible iniciar sesión.' });
  }
};
