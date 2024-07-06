const express = require('express');
const router = express.Router();
const Order = require('../models/Order'); // Asegúrate de tener este modelo definido

// Crear una orden
router.post('/', async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        const savedOrder = await newOrder.save();
        res.status(201).json(savedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtener todas las órdenes
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().populate('customerId').populate('products');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Obtener una orden por ID
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('customerId').populate('products');
        if (order == null) {
            return res.status(404).json({ message: 'Orden no encontrada' });
        }
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Actualizar una orden
router.put('/:id', async (req, res) => {
    try {
        const updatedOrder = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('customerId').populate('products');
        if (updatedOrder == null) {
            return res.status(404).json({ message: 'Orden no encontrada' });
        }
        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Eliminar una orden
router.delete('/:id', async (req, res) => {
    try {
        const deletedOrder = await Order.findByIdAndDelete(req.params.id);
        if (deletedOrder == null) {
            return res.status(404).json({ message: 'Orden no encontrada' });
        }
        res.json({ message: 'Orden eliminada con éxito' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
