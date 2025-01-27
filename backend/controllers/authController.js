const bcrypt = require('bcrypt');
const Customer = require('../models/Customer');
const LoginLog = require('../models/LoginLog'); // Importar el modelo de Log de Inicio de Sesión
const { generateToken } = require('../utils/tokenUtils');
const { registerSchema, loginSchema } = require('../validations/customerValidation');

// Registro de un nuevo cliente
exports.registerCustomer = async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ message: 'Invalid data', error: error.details[0].message });

    const { firstName, lastName, email, identificationNumber, birthDate, password, confirmPassword, phone, preferences, role } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newCustomer = new Customer({ 
      firstName, 
      lastName, 
      email, 
      identificationNumber, 
      birthDate, 
      password: hashedPassword, 
      phone, 
      preferences, 
      role 
    });

    await newCustomer.save();
    res.status(201).json({ message: 'Customer registered successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error registering customer', error: error.message });
  }
};

// Inicio de sesión de un cliente
exports.loginCustomer = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: 'Invalid data', error: error.details[0].message });

    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(400).json({ message: 'Incorrect email or password' });
    }

    // Verificación simplificada de la contraseña
    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect email or password' });
    }

    // Registrar el inicio de sesión
    const loginLog = new LoginLog({ userId: customer._id, email: customer.email });
    await loginLog.save();

    console.log('Generating token...');
    const token = generateToken(customer);
    res.status(200).json({ token, user: customer, role: customer.role, message: 'Login successful' });
  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(400).json({ message: 'Error logging in', error: error.message });
  }
};
