const db = require('../config/db');
const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

function extensionImagen(buffer) {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return '';
}

function validarProducto(datos) {
  const nombre = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
  const descripcion = typeof datos.descripcion === 'string' ? datos.descripcion.trim() : '';
  const categoria = typeof datos.categoria === 'string' ? datos.categoria.trim() : '';
  const imagen = typeof datos.imagen === 'string' ? datos.imagen.trim() : '';
  const precio = Number(datos.precio);
  const stock = Number(datos.stock);
  if (!nombre || nombre.length > 100) return { error: 'El nombre debe tener entre 1 y 100 caracteres.' };
  if (!descripcion || descripcion.length > 255) return { error: 'La descripción debe tener entre 1 y 255 caracteres.' };
  if (!categoria || categoria.length > 50) return { error: 'La categoría debe tener entre 1 y 50 caracteres.' };
  if (!Number.isFinite(precio) || precio <= 0 || precio > 99999999.99) return { error: 'El precio debe ser mayor que cero.' };
  if (!Number.isSafeInteger(stock) || stock < 0 || stock > 99999) return { error: 'Las existencias deben ser un entero entre 0 y 99999.' };
  if (imagen.length > 255) return { error: 'La dirección de la imagen es demasiado larga.' };
  return { nombre, descripcion, categoria, precio: precio.toFixed(2), imagen, stock };
}

exports.listar = async (req, res) => {
  const [productos] = await db.query(`
    SELECT id, nombre, descripcion, categoria, precio, imagen, stock, activo
    FROM platos ORDER BY id DESC
  `);
  res.json(productos);
};

exports.crear = async (req, res) => {
  const producto = validarProducto(req.body || {});
  if (producto.error) return res.status(400).json({ mensaje: producto.error });
  const [resultado] = await db.execute(
    'INSERT INTO platos (nombre, descripcion, categoria, precio, imagen, stock, activo) VALUES (?, ?, ?, ?, ?, ?, 1)',
    [producto.nombre, producto.descripcion, producto.categoria, producto.precio, producto.imagen, producto.stock]
  );
  res.status(201).json({ id: resultado.insertId, mensaje: 'Producto creado correctamente.' });
};

exports.actualizar = async (req, res) => {
  const id = Number(req.params.id);
  const producto = validarProducto(req.body || {});
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ mensaje: 'Identificador no válido.' });
  if (producto.error) return res.status(400).json({ mensaje: producto.error });
  const activo = req.body.activo === false || req.body.activo === 0 ? 0 : 1;
  const [resultado] = await db.execute(
    `UPDATE platos SET nombre = ?, descripcion = ?, categoria = ?, precio = ?, imagen = ?, stock = ?, activo = ?
     WHERE id = ?`,
    [producto.nombre, producto.descripcion, producto.categoria, producto.precio, producto.imagen, producto.stock, activo, id]
  );
  if (!resultado.affectedRows) return res.status(404).json({ mensaje: 'Producto no encontrado.' });
  res.json({ mensaje: 'Producto actualizado correctamente.' });
};

exports.eliminar = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ mensaje: 'Identificador no válido.' });
  const [resultado] = await db.execute('UPDATE platos SET activo = 0 WHERE id = ?', [id]);
  if (!resultado.affectedRows) return res.status(404).json({ mensaje: 'Producto no encontrado.' });
  res.json({ mensaje: 'Producto retirado del menú.' });
};

exports.reactivar = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ mensaje: 'Identificador no válido.' });
  const [resultado] = await db.execute('UPDATE platos SET activo = 1 WHERE id = ?', [id]);
  if (!resultado.affectedRows) return res.status(404).json({ mensaje: 'Producto no encontrado.' });
  res.json({ mensaje: 'Producto reactivado en el menú.' });
};

exports.subirImagen = async (req, res) => {
  if (!Buffer.isBuffer(req.body) || !req.body.length) return res.status(400).json({ mensaje: 'Selecciona una imagen JPG, PNG o WebP.' });
  const extension = extensionImagen(req.body);
  if (!extension) return res.status(400).json({ mensaje: 'El archivo no es una imagen JPG, PNG o WebP válida.' });
  const nombre = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${extension}`;
  const directorio = path.join(__dirname, '../../public/images/uploads');
  await fs.mkdir(directorio, { recursive: true });
  await fs.writeFile(path.join(directorio, nombre), req.body);
  res.status(201).json({ ruta: `/images/uploads/${nombre}` });
};
