const db = require('../config/db');

exports.listar = async (req, res) => {
  const [platos] = await db.query(`
    SELECT id, nombre, descripcion, categoria, precio
    FROM platos
    WHERE activo = 1
    ORDER BY id
  `);
  res.json(platos);
};
