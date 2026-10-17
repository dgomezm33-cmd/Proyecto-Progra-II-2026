CREATE DATABASE IF NOT EXISTS pedidos_comida CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pedidos_comida;

CREATE TABLE IF NOT EXISTS platos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
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
  CONSTRAINT fk_detalle_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
  CONSTRAINT fk_detalle_plato FOREIGN KEY (plato_id) REFERENCES platos(id),
  CONSTRAINT uq_pedido_plato UNIQUE (pedido_id, plato_id),
  CHECK (cantidad BETWEEN 1 AND 99),
  CHECK (precio_unitario > 0)
) ENGINE=InnoDB;
