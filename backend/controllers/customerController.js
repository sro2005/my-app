const Customer = require('../models/Customer');
const Order = require('../models/Order');
const { calculateCustomerStatus } = require('../utils/calculateCustomerStatus');

// Función auxiliar para manejar errores
const handleError = (res, error, message, statusCode = 400) => {
  console.error(message, error);
  res.status(statusCode).json({ message, error: error.message });
};

// Obtener todos los clientes (solo admins)
exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find();
    const customersWithStatus = await Promise.all(customers.map(async (customer) => {
      const orders = await Order.find({ userId: customer._id });
      return { ...customer._doc, status: calculateCustomerStatus(customer.lastActivityDate), orders };
    }));
    res.status(200).json(customersWithStatus);
  } catch (error) {
    handleError(res, error, 'Error al obtener los clientes');
  }
};

// Obtener el perfil del cliente
exports.getProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user);
    if (!customer) return res.status(404).json({ message: 'Cliente no encontrado' });

    res.status(200).json({ ...customer._doc, status: calculateCustomerStatus(customer.lastActivityDate) });
  } catch (error) {
    handleError(res, error, 'Error al obtener el perfil');
  }
};

// Actualizar la información de un cliente (solo usuario o admin)
exports.updateCustomer = async (req, res) => {
  const { id } = req.params; // ID del cliente a actualizar
  const { firstName, lastName, email, identificationNumber, birthDate, phone, preferences } = req.body;

  try {
    // Convertir ambos valores a string para evitar problemas de tipo
    const userId = req.user._id.toString();
    const paramId = id.toString();

    // Verificar permisos (el usuario solo puede actualizar su propio perfil, a menos que sea admin)
    if (userId !== paramId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permisos para actualizar esta información' });
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      id,
      { firstName, lastName, email, identificationNumber, birthDate, phone, preferences },
      { new: true, runValidators: true }
    );

    if (!updatedCustomer) return res.status(404).json({ message: 'Cliente no encontrado' });

    res.status(200).json({ message: 'Cliente actualizado exitosamente', updatedCustomer });
  } catch (error) {
    handleError(res, error, 'Error al actualizar el cliente', 500);
  }
};

// Eliminar un cliente (solo admins)
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCustomer = await Customer.findByIdAndDelete(id);
    if (!deletedCustomer) return res.status(404).json({ message: 'Cliente no encontrado' });

    // Opcional: eliminar pedidos asociados
    await Order.deleteMany({ userId: id });

    res.status(200).json({ message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    handleError(res, error, 'Error al eliminar el cliente');
  }
};