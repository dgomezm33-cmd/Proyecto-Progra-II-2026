require('dotenv').config();
const express = require('express');
const path = require('path');
const routes = require('./routes');

const app = express();
app.use(express.json({ limit: '50kb' }));
app.use('/api', routes);
app.use('/api', (req, res) => res.status(404).json({ mensaje: 'Ruta no encontrada.' }));
app.use(express.static(path.join(__dirname, '../public')));
app.use((error, req, res, next) => {
  if (error.type === 'entity.parse.failed') return res.status(400).json({ mensaje: 'El JSON enviado no es válido.' });
  if (error.type === 'entity.too.large') return res.status(413).json({ mensaje: 'La solicitud es demasiado grande.' });
  console.error('Error:', error.message);
  res.status(500).json({ mensaje: 'No se pudo completar la operación.' });
});

const port = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(port, () => console.log(`Fase 4 disponible en http://localhost:${port}`));
}

module.exports = app;
