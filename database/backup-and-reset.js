require('dotenv').config();
const fs = require('fs/promises');
const path = require('path');
const db = require('../src/config/db');

const productosOriginales = [
  [1, 'Hamburguesa clásica', 'Carne, queso, lechuga y tomate con papas fritas.', 'Platos fuertes', '35.00', '/images/menu/hamburguesa.png', 30, 1],
  [2, 'Pizza personal', 'Pizza de queso mozzarella y pepperoni.', 'Platos fuertes', '40.00', '/images/menu/pizza.png', 25, 1],
  [3, 'Tacos de pollo', 'Tres tacos de pollo con cebolla, cilantro y limón.', 'Platos fuertes', '25.00', '/images/menu/tacos.png', 35, 1],
  [4, 'Ensalada fresca', 'Lechuga, tomate, pepino y aderezo de la casa.', 'Ensaladas', '22.00', '/images/menu/ensalada.png', 20, 1],
  [5, 'Limonada', 'Limonada natural preparada al momento.', 'Bebidas', '10.00', '/images/menu/limonada.png', 50, 1],
  [6, 'Brownie', 'Brownie de chocolate de la casa.', 'Postres', '15.00', '/images/menu/brownie.png', 18, 1]
];

async function respaldarYReiniciar() {
  const conexion = await db.getConnection();
  let respaldo;
  try {
    const [platos] = await conexion.query('SELECT * FROM platos ORDER BY id');
    const [pedidos] = await conexion.query('SELECT * FROM pedidos ORDER BY id');
    const [detalles] = await conexion.query('SELECT * FROM detalle_pedido ORDER BY id');
    const ahora = new Date();
    const nombre = `backup-${ahora.toISOString().replace(/[:.]/g, '-')}.json`;
    const directorio = path.join(__dirname, 'backups');
    respaldo = path.join(directorio, nombre);
    await fs.mkdir(directorio, { recursive: true });
    await fs.writeFile(respaldo, JSON.stringify({
      creado_en: ahora.toISOString(),
      base_de_datos: process.env.DB_NAME || 'pedidos_comida',
      tablas: { platos, pedidos, detalle_pedido: detalles }
    }, null, 2), 'utf8');

    await conexion.beginTransaction();
    await conexion.query('DELETE FROM detalle_pedido');
    await conexion.query('DELETE FROM pedidos');
    await conexion.query('DELETE FROM platos');
    for (const producto of productosOriginales) {
      await conexion.execute(
        `INSERT INTO platos (id, nombre, descripcion, categoria, precio, imagen, stock, activo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, producto
      );
    }
    await conexion.commit();
    await conexion.query('ALTER TABLE platos AUTO_INCREMENT = 7');
    await conexion.query('ALTER TABLE pedidos AUTO_INCREMENT = 1');
    await conexion.query('ALTER TABLE detalle_pedido AUTO_INCREMENT = 1');
    console.log(`Respaldo creado: ${respaldo}`);
    console.log('Base reiniciada con 6 productos originales, 0 pedidos y 0 detalles.');
  } catch (error) {
    try { await conexion.rollback(); } catch {}
    if (respaldo) console.error(`El respaldo quedó disponible en: ${respaldo}`);
    throw error;
  } finally {
    conexion.release();
    await db.end();
  }
}

respaldarYReiniciar().catch(error => {
  console.error(`No se pudo reiniciar la base: ${error.message}`);
  process.exitCode = 1;
});
