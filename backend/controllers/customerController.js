const Customer = require('../models/Customer');
const Joi = require('joi');
const Order = require('../models/Order');
const { calculateCustomerStatus } = require('../utils/calculateCustomerStatus');

// Función auxiliar para manejar errores
const handleError = (res, error, message, statusCode = 500) => {
  console.error(message, error.message);
  res.status(statusCode).json({ message });
};

// Obtener todos los clientes (solo admins)
exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find();
    const customersWithStatus = await Promise.all(customers.map(async (customer) => {
      const orders = await Order.find({ userId: customer._id });
      // Usa toJSON para aplicar la transformación que elimina contraseña y campos internos.
      return { ...customer.toJSON(), status: calculateCustomerStatus(customer.lastActivityDate), orders };
    }));
    res.status(200).json(customersWithStatus);
  } catch (error) {
    handleError(res, error, 'Error al obtener los clientes');
  }
};

// Obtener el perfil del cliente
exports.getProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id);
    if (!customer) return res.status(404).json({ message: 'Cliente no encontrado' });

    res.status(200).json({ ...customer.toJSON(), status: calculateCustomerStatus(customer.lastActivityDate) });
  } catch (error) {
    handleError(res, error, 'Error al obtener el perfil');
  }
};

// Actualizar la información de un cliente (solo usuario o admin)
exports.updateCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    if (!/^[a-f\\d]{24}$/i.test(id)) {
      return res.status(400).json({ message: 'Identificador de cliente inválido.' });
    }

    const userId = String(req.user._id);
    if (userId !== String(id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permisos para actualizar esta información' });
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const allowedFields = ['firstName', 'lastName', 'email', 'identificationNumber', 'birthDate', 'phone', 'preferences'];
    const updates = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) updates[field] = body[field];
    }

    const updateSchema = Joi.object({
      firstName: Joi.string().trim().min(1).max(100),
      lastName: Joi.string().trim().min(1).max(100),
      email: Joi.string().trim().email().max(254),
      identificationNumber: Joi.string().pattern(/^[0-9]{1,3}([.][0-9]{3})*$/),
      birthDate: Joi.date().iso().max('now'),
      phone: Joi.string().trim().min(7).max(30),
      preferences: Joi.array().items(Joi.string().trim().min(1).max(100)).max(30)
    }).min(1);

    const { error, value } = updateSchema.validate(updates, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({
        message: 'Datos de perfil inválidos.',
        errors: error.details.map((detail) => detail.message)
      });
    }

    if (value.email) value.email = value.email.toLowerCase();
    const updatedCustomer = await Customer.findByIdAndUpdate(id, { $set: value }, {
      new: true,
      runValidators: true,
      context: 'query'
    });

    if (!updatedCustomer) return res.status(404).json({ message: 'Cliente no encontrado' });
    return res.status(200).json({
      message: 'Cliente actualizado exitosamente',
      updatedCustomer: updatedCustomer.toJSON()
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'El correo o número de identificación ya está registrado.' });
    }
    handleError(res, error, 'Error al actualizar el cliente', 500);
  }
};

// Eliminar un cliente (solo admins)
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id);
    if (!customer) return res.status(404).json({ message: 'Cliente no encontrado' });

    // Conserva la trazabilidad y evita dejar reservas de inventario huérfanas.
    const orderCount = await Order.countDocuments({ userId: id });
    if (orderCount > 0) {
      return res.status(409).json({
        message: 'No se puede eliminar este cliente porque tiene pedidos asociados. Conserva el historial de compra.'
      });
    }

    await Customer.findByIdAndDelete(id);
    res.status(200).json({ message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    handleError(res, error, 'Error al eliminar el cliente');
  }
};