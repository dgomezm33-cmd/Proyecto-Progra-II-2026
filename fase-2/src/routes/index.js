const express = require('express');
const platosController = require('../controllers/platos.controller');

const router = express.Router();
router.get('/platos', platosController.listar);

module.exports = router;
