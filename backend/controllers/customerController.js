const Customer = require('../models/Customer');
const bcrypt = require('bcrypt'); // Asegúrate de importar bcrypt para la comparación de contraseñas
const Joi = require('joi'); // Importa Joi para la validación de datos
const jwt = require('jsonwebtoken'); // Importa jwt para la generación de tokens
const crypto = require('crypto'); // Importar crypto para generar tokens
const nodemailer = require('nodemailer'); // Importar nodemailer para enviar correos

// Esquema de validación para el registro de cliente
const customerSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  identificationNumber: Joi.string().required(),
  birthDate: Joi.date().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().required(),
  preferences: Joi.array().items(Joi.string()),
  role: Joi.string().valid('user', 'admin').default('user') // Añadido el campo role
});

// Registro de un nuevo cliente
exports.registerCustomer = async (req, res) => {
  try {
    // Validar datos de entrada
    const { error } = customerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', error: error.details[0].message });
    }

    const { firstName, lastName, email, identificationNumber, birthDate, password, phone, preferences, role } = req.body;
    
    // Cifrar la contraseña 
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Crear un nuevo cliente
    const newCustomer = new Customer({
      firstName,
      lastName,
      email,
      identificationNumber,
      birthDate,
      password: hashedPassword, // Asegúrate de encriptar la contraseña
      phone,
      preferences,
      role // Establecer el rol del usuario
    });

    // Guardar el cliente en la base de datos
    await newCustomer.save();
    res.status(201).json({ message: 'Cliente registrado exitosamente' });
  } catch (error) {
    res.status(400).json({ message: 'Error al registrar el cliente', error: error.message });
  }
};

// Inicio de sesión de un cliente
exports.loginCustomer = async (req, res) => {
    const { email, password } = req.body;

    try { 
      // Verifica que el correo y la contraseña estén proporcionados 
      if (!email || !password) { 
        return res.status(400).json({ message: 'Email y contraseña son requeridos' });
      } 
      // Busca al cliente por correo 
      const customer = await Customer.findOne({ email }); 
      if (!customer) { 
        return res.status(400).json({ message: 'Correo o contraseña incorrectos' }); 
      } 
      // Verifica la contraseña 
      const isMatch = await bcrypt.compare(password, customer.password); 
      if (!isMatch) { 
        return res.status(400).json({ message: 'Correo o contraseña incorrectos' }); 
      }

    // Generar el token JWT
    const token = jwt.sign({ id: customer._id, role: customer.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    res.status(200).json({ token, user: customer, role: customer.role, message: 'Inicio de sesión exitoso' });
  } catch (error) {
    res.status(400).json({ message: 'Error al iniciar sesión', error: error.message });
  }
};

// Obtener todos los clientes
exports.getCustomers = async (req, res) => {
  try {
    // Obtener todos los clientes desde la base de datos
    const customers = await Customer.find();

    // Enviar una respuesta exitosa con la lista de clientes
    res.status(200).json(customers);
  } catch (error) {
    res.status(400).json({ message: 'Error al obtener los clientes', error: error.message });
  }
};

// Actualizar la información de un cliente
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, identificationNumber, birthDate, phone, preferences } = req.body;

    // Buscar y actualizar el cliente
    const updatedCustomer = await Customer.findByIdAndUpdate(
      id,
      { firstName, lastName, email, identificationNumber, birthDate, phone, preferences },
      { new: true, runValidators: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    res.status(200).json({ message: 'Cliente actualizado exitosamente', updatedCustomer });
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar el cliente', error: error.message });
  }
};

// Eliminar un cliente
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar y eliminar el cliente
    const deletedCustomer = await Customer.findByIdAndDelete(id);

    if (!deletedCustomer) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    res.status(200).json({ message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    res.status(400).json({ message: 'Error al eliminar el cliente', error: error.message });
  }
};

// Recuperar contraseña - Nuevo 
exports.forgotPassword = async (req, res) => { 
  const { email } = req.body;
  try { 
    const customer = await Customer.findOne({ email }); 
    if (!customer) { 
      return res.status(404).send({ message: 'Correo electrónico no encontrado' });
     } 
     
    const token = crypto.randomBytes(20).toString('hex'); 
    customer.resetPasswordToken = token; 
    customer.resetPasswordExpires = Date.now() + 3600000; // 1 hora 
    await customer.save();

    const transporter = nodemailer.createTransport({ 
      service: 'gmail', 
      auth: { 
        user: process.env.EMAIL_ADDRESS, 
        pass: process.env.EMAIL_PASSWORD 
      }
    });

    const mailOptions = { 
      to: customer.email, 
      from: process.env.EMAIL_ADDRESS,
      subject: 'Restablecimiento de contraseña',
      text: `Recibiste esto porque tú (o alguien más) ha solicitado restablecer la contraseña de tu cuenta.\n\n 
      Haz clic en el siguiente enlace, o pégalo en tu navegador para completar el proceso:\n\n 
      http://${req.headers.host}/reset-password/${token}\n\n 
      // Si no solicitaste esto, ignora este correo y tu contraseña permanecerá sin cambios.\n`
    };

    transporter.sendMail(mailOptions, (err, response) => { 
      if (err) { 
        console.error('Error al enviar el correo:', err);
        return res.status(500).send({ message: 'Error al enviar el correo' }); 
      } 
      res.status(200).send({ message: 'Correo de recuperación enviado con éxito' }); 
    }); 
  } catch (error) { 
    console.error('Error en el proceso de recuperación:', error); 
    res.status(500).send({ message: 'Error en el proceso de recuperación' }); 
  } 
};
