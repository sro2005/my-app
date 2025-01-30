const Customer = require('../models/Customer');

// Obtener todos los clientes (solo admins)
exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find();
    res.status(200).json(customers);
  } catch (error) {
    console.error('Error al obtener los clientes:', error);
    res.status(400).json({ message: 'Error al obtener los clientes', error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id);
    if (!customer) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    res.status(200).json({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      identificationNumber: customer.identificationNumber,
      birthDate: customer.birthDate,
      phone: customer.phone,
      preferences: customer.preferences
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
