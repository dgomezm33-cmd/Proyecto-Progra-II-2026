const db = require('../config/db');

exports.listarPlatos = async (req, res) => {
  const [platos] = await db.query(`
    SELECT id, nombre, descripcion, categoria, precio
    FROM platos WHERE activo = 1 ORDER BY id
  `);
  res.json(platos);
};

exports.crearPedido = async (req, res) => {
  const { cliente, notas = '', productos } = req.body || {};
  if (typeof cliente !== 'string' || !cliente.trim() || cliente.trim().length > 100) {
    return res.status(400).json({ mensaje: 'Escribe un nombre de hasta 100 caracteres.' });
  }
  if (typeof notas !== 'string' || notas.trim().length > 500) {
    return res.status(400).json({ mensaje: 'Las indicaciones deben tener hasta 500 caracteres.' });
  }
  if (!Array.isArray(productos) || productos.length < 1 || productos.length > 50) {
    return res.status(400).json({ mensaje: 'Agrega al menos un plato al pedido.' });
  }

  const ids = new Set();
  for (const producto of productos) {
    if (!producto || !Number.isSafeInteger(producto.plato_id) || producto.plato_id < 1 ||
        !Number.isInteger(producto.cantidad) || producto.cantidad < 1 || producto.cantidad > 99 ||
        ids.has(producto.plato_id)) {
      return res.status(400).json({ mensaje: 'Los productos o cantidades no son válidos.' });
    }
    ids.add(producto.plato_id);
  }

  const conexion = await db.getConnection();
  try {
    await conexion.beginTransaction();
    const marcadores = productos.map(() => '?').join(',');
    const [platos] = await conexion.execute(
      `SELECT id, precio FROM platos WHERE activo = 1 AND id IN (${marcadores}) FOR UPDATE`,
      [...ids]
    );
    if (platos.length !== productos.length) {
      await conexion.rollback();
      return res.status(400).json({ mensaje: 'Uno de los platos ya no está disponible.' });
    }

    let totalCentavos = 0;
    const detalles = productos.map(producto => {
      const plato = platos.find(item => item.id === producto.plato_id);
      totalCentavos += Math.round(Number(plato.precio) * 100) * producto.cantidad;
      return { ...producto, precio: plato.precio };
    });
    const total = (totalCentavos / 100).toFixed(2);
    const [resultado] = await conexion.execute(
      'INSERT INTO pedidos (cliente, notas, total) VALUES (?, ?, ?)',
      [cliente.trim(), notas.trim(), total]
    );
    for (const detalle of detalles) {
      await conexion.execute(
        'INSERT INTO detalle_pedido (pedido_id, plato_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
        [resultado.insertId, detalle.plato_id, detalle.cantidad, detalle.precio]
      );
    }
    await conexion.commit();
    res.status(201).json({ id: resultado.insertId, total, mensaje: 'Pedido registrado correctamente.' });
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
};
