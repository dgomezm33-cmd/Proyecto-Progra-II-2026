require('dotenv').config();
const db = require('../src/config/db');

async function migrar() {
  const [columnas] = await db.query(`
    SELECT COLUMN_NAME
    FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'platos'
  `);
  const nombres = new Set(columnas.map(columna => columna.COLUMN_NAME));
  if (!nombres.has('categoria')) {
    await db.query("ALTER TABLE platos ADD COLUMN categoria VARCHAR(50) NOT NULL DEFAULT 'Sin categoría' AFTER descripcion");
  }
  if (!nombres.has('imagen')) {
    await db.query("ALTER TABLE platos ADD COLUMN imagen VARCHAR(255) NOT NULL DEFAULT '' AFTER precio");
  }
  if (!nombres.has('stock')) {
    await db.query('ALTER TABLE platos ADD COLUMN stock INT UNSIGNED NOT NULL DEFAULT 20 AFTER imagen');
  }
  await db.query(`
    UPDATE platos SET categoria = CASE id
      WHEN 1 THEN 'Platos fuertes' WHEN 2 THEN 'Platos fuertes' WHEN 3 THEN 'Platos fuertes'
      WHEN 4 THEN 'Ensaladas' WHEN 5 THEN 'Bebidas' WHEN 6 THEN 'Postres' ELSE categoria END
  `);
  await db.query(`
    UPDATE platos SET imagen = CASE id
      WHEN 1 THEN '/images/menu/hamburguesa.png' WHEN 2 THEN '/images/menu/pizza.png'
      WHEN 3 THEN '/images/menu/tacos.png' WHEN 4 THEN '/images/menu/ensalada.png'
      WHEN 5 THEN '/images/menu/limonada.png' WHEN 6 THEN '/images/menu/brownie.png' ELSE imagen END
  `);
  console.log('Migración administrativa completada.');
}

migrar()
  .catch(error => {
    console.error(`No se pudo migrar la base de datos: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => db.end());
