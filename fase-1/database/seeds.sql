USE pedidos_comida;

INSERT INTO platos (id, nombre, descripcion, categoria, precio, activo) VALUES
  (1, 'Hamburguesa clásica', 'Carne, queso, lechuga y tomate con papas fritas.', 'Platos fuertes', 35.00, TRUE),
  (2, 'Pizza personal', 'Pizza de queso mozzarella y pepperoni.', 'Platos fuertes', 40.00, TRUE),
  (3, 'Tacos de pollo', 'Tres tacos de pollo con cebolla, cilantro y limón.', 'Platos fuertes', 25.00, TRUE),
  (4, 'Ensalada fresca', 'Lechuga, tomate, pepino y aderezo de la casa.', 'Ensaladas', 22.00, TRUE),
  (5, 'Limonada', 'Limonada natural preparada al momento.', 'Bebidas', 10.00, TRUE),
  (6, 'Brownie', 'Brownie de chocolate de la casa.', 'Postres', 15.00, TRUE)
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre),
  descripcion = VALUES(descripcion),
  categoria = VALUES(categoria),
  precio = VALUES(precio),
  activo = VALUES(activo);
