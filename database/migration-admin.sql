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

UPDATE platos SET categoria = CASE id
  WHEN 1 THEN 'Platos fuertes' WHEN 2 THEN 'Platos fuertes' WHEN 3 THEN 'Platos fuertes'
  WHEN 4 THEN 'Ensaladas' WHEN 5 THEN 'Bebidas' WHEN 6 THEN 'Postres' ELSE categoria END;

UPDATE platos SET imagen = CASE id
  WHEN 1 THEN '/images/menu/hamburguesa.png' WHEN 2 THEN '/images/menu/pizza.png'
  WHEN 3 THEN '/images/menu/tacos.png' WHEN 4 THEN '/images/menu/ensalada.png'
  WHEN 5 THEN '/images/menu/limonada.png' WHEN 6 THEN '/images/menu/brownie.png' ELSE imagen END;
