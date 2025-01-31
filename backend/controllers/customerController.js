const Customer = require('../models/Customer');
const Order = require('../models/Order');
const { calculateCustomerStatus } = require('../utils/calculateCustomerStatus');

// Obtener todos los clientes (solo admins)
exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find();
    const customersWithStatus = await Promise.all(customers.map(async (customer) => {
      const orders = await Order.find({ userId: customer._id });
      const status = calculateCustomerStatus(customer.lastActivityDate);
      return { ...customer._doc, status, orders };
    }));
    res.status(200).json(customersWithStatus);
  } catch (error) {
    console.error('Error al obtener los clientes:', error);
    res.status(400).json({ message: 'Error al obtener los clientes', error: error.message });
  }
};

// Obtener el perfil del cliente
exports.getProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id);
    if (!customer) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    const orders = await Order.find({ userId: req.user.id });
    const status = calculateCustomerStatus(customer.lastActivityDate);

    res.status(200).json({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      identificationNumber: customer.identificationNumber,
      birthDate: customer.birthDate,
      phone: customer.phone,
      preferences: customer.preferences,
      lastActivityDate: customer.lastActivityDate,
      status,
      orders
    });
  } catch (error) {
    console.error('Error al obtener el perfil:', error);
    res.status(500).json({ message: 'Error al obtener el perfil', error: error.message });
  }
};

// Actualizar la información de un cliente (solo admins)
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, identificationNumber, birthDate, phone, preferences } = req.body;

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
    console.error('Error al actualizar el cliente:', error);
    res.status(400).json({ message: 'Error al actualizar el cliente', error: error.message });
  }
};

// Eliminar un cliente (solo admins)
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCustomer = await Customer.findByIdAndDelete(id);

    if (!deletedCustomer) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    res.status(200).json({ message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar el cliente:', error);
    res.status(400).json({ message: 'Error al eliminar el cliente', error: error.message });
  }
};