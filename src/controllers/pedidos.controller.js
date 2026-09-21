const db = require('../config/db');
const estados = ['pendiente', 'en preparación', 'entregado'];

exports.listarPlatos = async (req, res) => {
  const [platos] = await db.query('SELECT id, nombre, descripcion, precio FROM platos WHERE activo = 1 ORDER BY id');
  res.json(platos);
};

exports.listarPedidos = async (req, res) => {
  const [pedidos] = await db.query('SELECT id, cliente, notas, estado, total, fecha FROM pedidos ORDER BY id DESC');
  const [detalles] = await db.query(`
    SELECT d.pedido_id, d.plato_id, p.nombre, d.cantidad, d.precio_unitario
    FROM detalle_pedido d JOIN platos p ON p.id = d.plato_id ORDER BY d.id
  `);
  res.json(pedidos.map(pedido => ({
    ...pedido,
    detalles: detalles.filter(detalle => detalle.pedido_id === pedido.id)
  })));
};

exports.crearPedido = async (req, res) => {
  const { cliente, notas = '', productos } = req.body || {};
  if (typeof cliente !== 'string' || !cliente.trim() || cliente.trim().length > 100) {
    return res.status(400).json({ mensaje: 'Escribe un nombre de cliente de hasta 100 caracteres.' });
  }
  if (typeof notas !== 'string' || notas.trim().length > 500) {
    return res.status(400).json({ mensaje: 'Las notas deben tener hasta 500 caracteres.' });
  }
  if (!Array.isArray(productos) || productos.length === 0 || productos.length > 50) {
    return res.status(400).json({ mensaje: 'El pedido debe incluir entre 1 y 50 platos diferentes.' });
  }
  const ids = new Set();
  for (const producto of productos) {
    if (!producto || !Number.isSafeInteger(producto.plato_id) || producto.plato_id < 1 ||
        !Number.isInteger(producto.cantidad) || producto.cantidad < 1 || producto.cantidad > 99 || ids.has(producto.plato_id)) {
      return res.status(400).json({ mensaje: 'Cada plato debe ser único y tener una cantidad entera entre 1 y 99.' });
    }
    ids.add(producto.plato_id);
  }

  const conexion = await db.getConnection();
  try {
    // La transacción evita guardar un pedido sin todos sus detalles.
    await conexion.beginTransaction();
    const marcadores = productos.map(() => '?').join(',');
    const [platos] = await conexion.execute(
      `SELECT id, precio FROM platos WHERE activo = 1 AND id IN (${marcadores}) FOR UPDATE`, [...ids]
    );
    if (platos.length !== productos.length) {
      await conexion.rollback();
      return res.status(400).json({ mensaje: 'Uno de los platos ya no está disponible.' });
    }
    // Los precios se consultan en MySQL; no confiamos en totales enviados por el navegador.
    // Calculamos en centavos para evitar errores de redondeo con decimales.
    let totalCentavos = 0;
    const detalles = productos.map(producto => {
      const plato = platos.find(item => item.id === producto.plato_id);
      totalCentavos += Math.round(Number(plato.precio) * 100) * producto.cantidad;
      return { ...producto, precio: plato.precio };
    });
    const total = (totalCentavos / 100).toFixed(2);
    const [resultado] = await conexion.execute(
      'INSERT INTO pedidos (cliente, notas, total) VALUES (?, ?, ?)', [cliente.trim(), notas.trim(), total]
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

exports.actualizarEstado = async (req, res) => {
  const id = Number(req.params.id);
  const { estado } = req.body || {};
  if (!Number.isSafeInteger(id) || id < 1 || !estados.includes(estado)) {
    return res.status(400).json({ mensaje: 'El identificador o el estado no es válido.' });
  }
  const [resultado] = await db.execute('UPDATE pedidos SET estado = ? WHERE id = ?', [estado, id]);
  if (!resultado.affectedRows) return res.status(404).json({ mensaje: 'Pedido no encontrado.' });
  res.json({ mensaje: 'Estado actualizado.' });
};
