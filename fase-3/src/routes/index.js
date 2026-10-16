const express = require('express');
const controller = require('../controllers/pedidos.controller');

const router = express.Router();
router.get('/platos', controller.listarPlatos);
router.post('/pedidos', controller.crearPedido);

module.exports = router;
