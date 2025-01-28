const bcrypt = require('bcrypt');
const Customer = require('../models/Customer');
const { registerOrUpdateLoginLog } = require('../models/LoginLog');
const { generateToken } = require('../utils/tokenUtils');

// Registro de un nuevo cliente
exports.registerCustomer = async (req, res) => {
  try {
    console.log('Datos recibidos para registrar cliente:', req.body); // Verifica que los datos recibidos contengan la contraseña
    // Desestructuramos los datos del body
    const { firstName, lastName, email, identificationNumber, birthDate, password, phone, preferences, role } = req.body;

    // Eliminar espacios adicionales en la contraseña
    const trimmedPassword = password.trim();
    console.log('Contraseña recibida para registrar:', trimmedPassword); // Agregado para ver la contraseña sin espacios

    // Comprobamos si el email ya está registrado
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    // Hasheamos la contraseña
    const hashedPassword = await bcrypt.hash(trimmedPassword, 10); // Hasheo de la contraseña
    console.log('Contraseña hasheada durante el registro:', hashedPassword); // Agregado para ver el hash

    // Asignar el rol: Si no se pasa, por defecto será "user", si es admin, se toma desde el body
    const userRole = role === "admin" ? "admin" : "user"; 

    const newCustomer = new Customer({
      firstName,
      lastName,
      email,
      identificationNumber,
      birthDate,
      password: hashedPassword, // Siempre incluimos la contraseña hasheada
      phone,
      preferences,
      role: userRole,
    });

    await newCustomer.save();
    res.status(201).json({ message: 'Customer registered successfully' });
  } catch (error) {
    console.error('Error en el registro:', error); // Mensaje de error más detallado
    res.status(400).json({ message: 'Error registering customer', error: error.message });
  }
};

// Inicio de sesión de un cliente
exports.loginCustomer = async (req, res) => {
  const { email, password } = req.body;

  console.log('Datos de login recibidos:', req.body); // Verifica que se está recibiendo correctamente el email y la contraseña

  try {
    // Buscar al cliente por correo electrónico
    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(400).json({ message: 'Incorrect email or password' });
    }

    // Eliminar espacios adicionales en la contraseña proporcionada
    const trimmedPassword = password.trim();
    console.log('Contraseña recibida para login:', trimmedPassword); // Verifica la contraseña recibida

    // Comparar la contraseña proporcionada con el hash almacenado
    const comparisonResult = await bcrypt.compare(trimmedPassword, customer.password);
    console.log('Resultado de comparación de contraseñas:', comparisonResult); // Verifica el resultado de la comparación de la contraseña

    if (!comparisonResult) {
      return res.status(400).json({ message: 'Incorrect email or password' });
    }

    // Registrar o actualizar el intento de inicio de sesión en LoginLog
    await registerOrUpdateLoginLog(customer);

    // Generar el token de autenticación
    const token = generateToken(customer);

    return res.status(200).json({
      token,
      user: customer,
      role: customer.role,
      message: 'Login successful',
    });

  } catch (error) {
    console.error('Error en el inicio de sesión:', error.message); // Log para errores
    res.status(400).json({ message: 'Error logging in', error: error.message });
  }
};
