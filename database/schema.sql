CREATE DATABASE IF NOT EXISTS pedidos_comida CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pedidos_comida;

CREATE TABLE IF NOT EXISTS platos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  categoria VARCHAR(50) NOT NULL DEFAULT 'Sin categoría',
  precio DECIMAL(10,2) NOT NULL,
  imagen VARCHAR(255) NOT NULL DEFAULT '',
  stock INT UNSIGNED NOT NULL DEFAULT 0,
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

INSERT INTO platos (id, nombre, descripcion, categoria, precio, imagen, stock) VALUES
  (1, 'Hamburguesa clásica', 'Carne, queso, lechuga y tomate con papas fritas.', 'Platos fuertes', 35.00, '/images/menu/hamburguesa.png', 30),
  (2, 'Pizza personal', 'Pizza de queso mozzarella y pepperoni.', 'Platos fuertes', 40.00, '/images/menu/pizza.png', 25),
  (3, 'Tacos de pollo', 'Tres tacos de pollo con cebolla, cilantro y limón.', 'Platos fuertes', 25.00, '/images/menu/tacos.png', 35),
  (4, 'Ensalada fresca', 'Lechuga, tomate, pepino y aderezo de la casa.', 'Ensaladas', 22.00, '/images/menu/ensalada.png', 20),
  (5, 'Limonada', 'Limonada natural preparada al momento.', 'Bebidas', 10.00, '/images/menu/limonada.png', 50),
  (6, 'Brownie', 'Brownie de chocolate de la casa.', 'Postres', 15.00, '/images/menu/brownie.png', 18)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), descripcion = VALUES(descripcion),
  categoria = VALUES(categoria), precio = VALUES(precio), imagen = VALUES(imagen), activo = TRUE;
