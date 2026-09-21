CREATE DATABASE IF NOT EXISTS pedidos_comida CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pedidos_comida;

CREATE TABLE IF NOT EXISTS platos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  CHECK (precio > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pedidos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cliente VARCHAR(100) NOT NULL,
  notas VARCHAR(500) NOT NULL DEFAULT '',
  estado ENUM('pendiente', 'en preparación', 'entregado') NOT NULL DEFAULT 'pendiente',
  total DECIMAL(10,2) NOT NULL,
  fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (total >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS detalle_pedido (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT UNSIGNED NOT NULL,
  plato_id INT UNSIGNED NOT NULL,
  cantidad INT UNSIGNED NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
  FOREIGN KEY (plato_id) REFERENCES platos(id),
  UNIQUE (pedido_id, plato_id),
  CHECK (cantidad BETWEEN 1 AND 99),
  CHECK (precio_unitario > 0)
) ENGINE=InnoDB;

INSERT INTO platos (id, nombre, descripcion, precio) VALUES
  (1, 'Hamburguesa clásica', 'Carne, queso, lechuga y tomate con papas fritas.', 35.00),
  (2, 'Pizza personal', 'Pizza de queso mozzarella y pepperoni.', 40.00),
  (3, 'Tacos de pollo', 'Tres tacos de pollo con cebolla, cilantro y limón.', 25.00),
  (4, 'Ensalada fresca', 'Lechuga, tomate, pepino y aderezo de la casa.', 22.00),
  (5, 'Limonada', 'Limonada natural preparada al momento.', 10.00),
  (6, 'Brownie', 'Brownie de chocolate de la casa.', 15.00)
ON DUPLICATE KEY UPDATE id = VALUES(id);
