const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const bcrypt = require('bcrypt');

// Crear un nuevo cliente
exports.createCustomer = async (req, res) => {
  try {
    const { firstName, lastName, email, birthDate, password, address, phone, preferences } = req.body;
    console.log('Datos recibidos:', req.body);
    // Verificar si ya existe un cliente con el mismo correo electrónico
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({ message: 'El cliente ya está registrado' });
    }

    // Hash de la contraseña antes de guardarla
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear un nuevo cliente
    const customer = new Customer({
      firstName,
      lastName,
      email,
      birthDate,
      password: hashedPassword,
      address,
      phone,
      preferences
    });

    await customer.save();
    res.status(201).json({ message: 'Cliente registrado exitosamente', customer });
  } catch (error) {
    console.error('Error al registrar cliente:', error.message);
    res.status(400).json({ error: error.message });
  }
}

// Obtener todos los clientes
exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.find().select('-password');
    res.status(200).json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Inicio de sesión de un cliente
exports.loginCustomer = async (req, res) => {
  const { email, password } = req.body;

  try {
    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    res.status(200).json({ message: 'Inicio de sesión exitoso' });
  } catch (error) {
    console.error('Error en el inicio de sesión:', error.message);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Actualizar un cliente
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, birthDate, address, phone, preferences } = req.body;

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    customer.firstName = firstName || customer.firstName;
    customer.lastName = lastName || customer.lastName;
    customer.email = email || customer.email;
    customer.birthDate = birthDate || customer.birthDate;
    customer.address = address || customer.address;
    customer.phone = phone || customer.phone;
    customer.preferences = preferences || customer.preferences;

    await customer.save();
    res.status(200).json({ message: 'Cliente actualizado exitosamente', customer });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Eliminar un cliente
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByIdAndDelete(id);
    if (!customer) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    res.status(200).json({ message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
