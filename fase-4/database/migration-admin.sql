USE pedidos_comida;

SET @agregar_categoria = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'platos' AND column_name = 'categoria') = 0,
  'ALTER TABLE platos ADD COLUMN categoria VARCHAR(50) NOT NULL DEFAULT ''Sin categoría'' AFTER descripcion',
  'SELECT 1'
);
PREPARE sentencia FROM @agregar_categoria;
EXECUTE sentencia;
DEALLOCATE PREPARE sentencia;

SET @agregar_imagen = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'platos' AND column_name = 'imagen') = 0,
  'ALTER TABLE platos ADD COLUMN imagen VARCHAR(255) NOT NULL DEFAULT '''' AFTER precio',
  'SELECT 1'
);
PREPARE sentencia FROM @agregar_imagen;
EXECUTE sentencia;
DEALLOCATE PREPARE sentencia;

SET @agregar_stock = IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE() AND table_name = 'platos' AND column_name = 'stock') = 0,
  'ALTER TABLE platos ADD COLUMN stock INT UNSIGNED NOT NULL DEFAULT 20 AFTER imagen',
  'SELECT 1'
);
PREPARE sentencia FROM @agregar_stock;
EXECUTE sentencia;
DEALLOCATE PREPARE sentencia;
