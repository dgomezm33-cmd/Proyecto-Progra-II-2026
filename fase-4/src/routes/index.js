const express = require('express');
const controller = require('../controllers/pedidos.controller');
const productosController = require('../controllers/productos.controller');
const admin = require('../middlewares/admin-auth');

const router = express.Router();
router.get('/platos', controller.listarPlatos);
router.post('/pedidos', controller.crearPedido);
router.post('/admin/login', admin.iniciarSesion);
router.delete('/admin/logout', admin.proteger, admin.cerrarSesion);
router.get('/pedidos', admin.proteger, controller.listarPedidos);
router.get('/admin/resumen', admin.proteger, controller.resumen);
router.patch('/pedidos/:id/estado', admin.proteger, controller.actualizarEstado);
router.get('/admin/platos', admin.proteger, productosController.listar);
router.post('/admin/platos', admin.proteger, productosController.crear);
router.post('/admin/imagenes', admin.proteger, express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '5mb' }), productosController.subirImagen);
router.put('/admin/platos/:id', admin.proteger, productosController.actualizar);
router.patch('/admin/platos/:id/reactivar', admin.proteger, productosController.reactivar);
router.delete('/admin/platos/:id', admin.proteger, productosController.eliminar);

module.exports = router;
