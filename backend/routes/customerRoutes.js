const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer'); // Asegúrate de tener este modelo definido

// Crear un cliente
router.post('/', async (req, res) => {
    try {
        const newCustomer = new Customer(req.body);
        const savedCustomer = await newCustomer.save();
        res.status(201).json(savedCustomer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtener todos los clientes
router.get('/', async (req, res) => {
    try {
        const customers = await Customer.find();
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtener un cliente por ID
router.get('/:id', async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (customer == null) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        res.json(customer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Actualizar un cliente
router.put('/:id', async (req, res) => {
    try {
        const updatedCustomer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (updatedCustomer == null) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        res.json(updatedCustomer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Eliminar un cliente
router.delete('/:id', async (req, res) => {
    try {
        const deletedCustomer = await Customer.findByIdAndDelete(req.params.id);
        if (deletedCustomer == null) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }
        res.json({ message: 'Cliente eliminado con éxito' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
