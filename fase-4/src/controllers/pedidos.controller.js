const db = require('../config/db');
const estados = ['pendiente', 'en preparación', 'entregado'];

exports.listarPlatos = async (req, res) => {
  const [platos] = await db.query(`
    SELECT id, nombre, descripcion, categoria, precio, imagen, stock
    FROM platos WHERE activo = 1 ORDER BY id
  `);
  res.json(platos);
};

exports.listarPedidos = async (req, res) => {
  const condiciones = [];
  const parametros = [];
  if (req.query.estado) {
    if (!estados.includes(req.query.estado)) return res.status(400).json({ mensaje: 'El estado seleccionado no es válido.' });
    condiciones.push('estado = ?');
    parametros.push(req.query.estado);
  }
  if (req.query.fecha) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(req.query.fecha)) return res.status(400).json({ mensaje: 'La fecha seleccionada no es válida.' });
    condiciones.push('DATE(fecha) = ?');
    parametros.push(req.query.fecha);
  }
  const where = condiciones.length ? ` WHERE ${condiciones.join(' AND ')}` : '';
  const [pedidos] = await db.execute(`SELECT id, cliente, notas, estado, total, fecha FROM pedidos${where} ORDER BY id DESC`, parametros);
  const [detalles] = await db.query(`
    SELECT d.pedido_id, d.plato_id, p.nombre, d.cantidad, d.precio_unitario
    FROM detalle_pedido d JOIN platos p ON p.id = d.plato_id ORDER BY d.id
  `);
  res.json(pedidos.map(pedido => ({
    ...pedido,
    detalles: detalles.filter(detalle => detalle.pedido_id === pedido.id)
  })));
};

exports.resumen = async (req, res) => {
  const [[pedidos]] = await db.query(`
    SELECT COUNT(*) AS pedidos_hoy, COALESCE(SUM(total), 0) AS ventas_hoy,
      COALESCE(SUM(estado = 'pendiente'), 0) AS pendientes,
      COALESCE(SUM(estado = 'en preparación'), 0) AS en_preparacion
    FROM pedidos WHERE DATE(fecha) = CURRENT_DATE
  `);
  const [[productos]] = await db.query(`
    SELECT COALESCE(SUM(activo = 1), 0) AS productos_activos,
      COALESCE(SUM(activo = 1 AND stock <= 5), 0) AS stock_bajo
    FROM platos
  `);
  res.json({ ...pedidos, ...productos });
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
      `SELECT id, precio, stock FROM platos WHERE activo = 1 AND id IN (${marcadores}) FOR UPDATE`, [...ids]
    );
    if (platos.length !== productos.length) {
      await conexion.rollback();
      return res.status(400).json({ mensaje: 'Uno de los platos ya no está disponible.' });
    }
    let totalCentavos = 0;
    const detalles = productos.map(producto => {
      const plato = platos.find(item => item.id === producto.plato_id);
      if (producto.cantidad > plato.stock) return null;
      totalCentavos += Math.round(Number(plato.precio) * 100) * producto.cantidad;
      return { ...producto, precio: plato.precio };
    });
    if (detalles.includes(null)) {
      await conexion.rollback();
      return res.status(400).json({ mensaje: 'No hay suficientes existencias de uno de los platos.' });
    }
    const total = (totalCentavos / 100).toFixed(2);
    const [resultado] = await conexion.execute(
      'INSERT INTO pedidos (cliente, notas, total) VALUES (?, ?, ?)', [cliente.trim(), notas.trim(), total]
    );
    for (const detalle of detalles) {
      await conexion.execute(
        'INSERT INTO detalle_pedido (pedido_id, plato_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
        [resultado.insertId, detalle.plato_id, detalle.cantidad, detalle.precio]
      );
      await conexion.execute('UPDATE platos SET stock = stock - ? WHERE id = ?', [detalle.cantidad, detalle.plato_id]);
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
