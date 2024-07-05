const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer'); // Modelo de datos para el cliente

// Ruta para registrar un nuevo cliente
router.post('/', async (req, res) => {
  try {
    const newCustomer = new Customer(req.body);
    await newCustomer.save();
    res.status(201).send(newCustomer);
  } catch (error) {
    console.error('Error registrando cliente:', error);
    res.status(500).send('Ocurrió un error al registrar al cliente. Por favor, intenta nuevamente.');
  }
});

module.exports = router;
