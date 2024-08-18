const Customer = require('../models/Customer'); // Importa el modelo de Cliente
const bcrypt = require('bcrypt'); // Importa bcrypt para encriptar contraseñas
const jwt = require('jsonwebtoken'); // Importa jsonwebtoken para generar tokens

// Crear un nuevo cliente
exports.createCustomer = async (req, res) => {
  try {
    // Extrae datos del cuerpo de la solicitud
    const { firstName, lastName, email, identificationNumber, birthDate, password, phone, preferences, role = 'client' } = req.body;

    // Hashea la contraseña antes de guardarla en la base de datos
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crea una nueva instancia del modelo Customer
    const newCustomer = new Customer({
      firstName,
      lastName,
      email,
      identificationNumber,
      birthDate,
      password: hashedPassword,
      phone,
      preferences,
      role // Se asume que el modelo Customer tiene un campo 'role'
    });

    // Guarda el nuevo cliente en la base de datos
    await newCustomer.save();
    res.status(201).json({ message: 'Cliente registrado exitosamente', customer: newCustomer });
  } catch (error) {
    // Maneja errores y responde con un mensaje de error
    res.status(400).json({ message: "Error al registrar el cliente", error: error.message });
  }
};

// Iniciar sesión
exports.loginCustomer = async (req, res) => {
  const { email, password } = req.body; // Extrae email y contraseña del cuerpo de la solicitud

  try {
    // Llama al método estático `authenticate` del modelo Customer para verificar credenciales
    const customer = await Customer.authenticate(email, password);
    
    // Genera un token JWT con el id del cliente y su rol
    const token = jwt.sign({ id: customer._id, role: customer.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

    // Responde con el token generado
    res.status(200).json({ message: 'Inicio de sesión exitoso', token });
  } catch (error) {
    // Maneja errores en el inicio de sesión
    res.status(400).json({ message: 'Credenciales inválidas' });
  }
};

// Obtener todos los clientes
exports.getCustomer = async (req, res) => {
  try {
    // Obtiene todos los clientes de la base de datos
    const customers = await Customer.find();
    res.status(200).json(customers);
  } catch (error) {
    // Maneja errores al obtener clientes
    res.status(400).json({ error: error.message });
  }
};

// Actualizar un cliente
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params; // Extrae el id del cliente de los parámetros de la solicitud
    const { firstName, lastName, email, identificationNumber, birthDate, password, phone, preferences } = req.body;

    // Prepara los datos a actualizar
    const updateData = {
      firstName,
      lastName,
      email,
      identificationNumber,
      birthDate,
      phone,
      preferences
    };

    // Hashea la nueva contraseña si está presente en el cuerpo de la solicitud
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Actualiza el cliente en la base de datos
    const updatedCustomer = await Customer.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedCustomer) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    // Responde con el cliente actualizado
    res.status(200).json({ message: 'Cliente actualizado exitosamente', customer: updatedCustomer });
  } catch (error) {
    // Maneja errores al actualizar un cliente
    res.status(400).json({ error: error.message });
  }
};

// Eliminar un cliente
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params; // Extrae el id del cliente de los parámetros de la solicitud

    // Elimina el cliente de la base de datos
    const customer = await Customer.findByIdAndDelete(id);

    if (!customer) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    // Responde con un mensaje de éxito
    res.status(200).json({ message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    // Maneja errores al eliminar un cliente
    res.status(400).json({ error: error.message });
  }
};
