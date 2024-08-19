const Customer = require('../models/Customer');
const bcrypt = require('bcrypt'); // Asegúrate de importar bcrypt para la comparación de contraseñas

// Registro de un nuevo cliente
exports.registerCustomer = async (req, res) => {
  try {
    const { firstName, lastName, email, identificationNumber, birthDate, password, phone, preferences } = req.body;

    // Crear un nuevo cliente
    const newCustomer = new Customer({
      firstName,
      lastName,
      email,
      identificationNumber,
      birthDate,
      password: await bcrypt.hash(password, 10), // Asegúrate de encriptar la contraseña
      phone,
      preferences
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
  try {
    const { email, password } = req.body;

    // Buscar al cliente por correo electrónico
    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(400).json({ message: 'El correo electrónico no está registrado' });
    }

    // Verificar la contraseña
    const match = await bcrypt.compare(password, customer.password);
    if (!match) {
      return res.status(400).json({ message: 'Contraseña incorrecta' });
    }

    // Inicio de sesión exitoso sin devolver el customerId
    res.status(200).json({ message: 'Inicio de sesión exitoso' });
  } catch (error) {
    res.status(400).json({ message: 'Error al iniciar sesión', error: error.message });
  }
};

// Obtener todos los clientes
exports.getCustomer = async (req, res) => {
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
      { new: true }
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
