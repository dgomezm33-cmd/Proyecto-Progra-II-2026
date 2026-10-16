const express = require('express');
const controller = require('../controllers/pedidos.controller');

const router = express.Router();
router.get('/platos', controller.listarPlatos);
router.get('/pedidos', controller.listarPedidos);
router.post('/pedidos', controller.crearPedido);
router.patch('/pedidos/:id/estado', controller.actualizarEstado);

module.exports = router;
