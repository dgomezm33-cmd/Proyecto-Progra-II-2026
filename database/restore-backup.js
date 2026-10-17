require('dotenv').config();
const fs = require('fs/promises');
const path = require('path');
const db = require('../src/config/db');

async function restaurar() {
  const argumento = process.argv[2];
  if (!argumento) throw new Error('Indica la ruta del archivo de respaldo JSON.');
  const ruta = path.resolve(argumento);
  const respaldo = JSON.parse(await fs.readFile(ruta, 'utf8'));
  const { platos, pedidos, detalle_pedido: detalles } = respaldo.tablas || {};
  if (!Array.isArray(platos) || !Array.isArray(pedidos) || !Array.isArray(detalles)) throw new Error('El archivo no contiene un respaldo válido.');

  const conexion = await db.getConnection();
  try {
    await conexion.beginTransaction();
    await conexion.query('DELETE FROM detalle_pedido');
    await conexion.query('DELETE FROM pedidos');
    await conexion.query('DELETE FROM platos');
    for (const producto of platos) {
      await conexion.execute(
        `INSERT INTO platos (id, nombre, descripcion, categoria, precio, imagen, stock, activo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [producto.id, producto.nombre, producto.descripcion, producto.categoria, producto.precio, producto.imagen, producto.stock, producto.activo]
      );
    }
    for (const pedido of pedidos) {
      await conexion.execute(
        `INSERT INTO pedidos (id, cliente, notas, estado, total, fecha) VALUES (?, ?, ?, ?, ?, ?)`,
        [pedido.id, pedido.cliente, pedido.notas, pedido.estado, pedido.total, pedido.fecha]
      );
    }
    for (const detalle of detalles) {
      await conexion.execute(
        `INSERT INTO detalle_pedido (id, pedido_id, plato_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?, ?)`,
        [detalle.id, detalle.pedido_id, detalle.plato_id, detalle.cantidad, detalle.precio_unitario]
      );
    }
    await conexion.commit();
    console.log(`Respaldo restaurado: ${ruta}`);
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
    await db.end();
  }
}

restaurar().catch(error => {
  console.error(`No se pudo restaurar el respaldo: ${error.message}`);
  process.exitCode = 1;
});
