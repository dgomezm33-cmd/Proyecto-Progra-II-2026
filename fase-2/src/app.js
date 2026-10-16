require('dotenv').config();
const express = require('express');
const path = require('path');
const routes = require('./routes');

const app = express();
app.use('/api', routes);
app.use('/api', (req, res) => res.status(404).json({ mensaje: 'Ruta no encontrada.' }));
app.use(express.static(path.join(__dirname, '../public')));
app.use((error, req, res, next) => {
  console.error(error.message);
  res.status(500).json({ mensaje: 'No se pudo consultar la base de datos.' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Fase 2 disponible en http://localhost:${port}`));
