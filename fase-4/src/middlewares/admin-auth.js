const crypto = require('crypto');

const sesiones = new Map();
const DURACION_SESION = 8 * 60 * 60 * 1000;

function iguales(a, b) {
  const valorA = Buffer.from(String(a));
  const valorB = Buffer.from(String(b));
  return valorA.length === valorB.length && crypto.timingSafeEqual(valorA, valorB);
}

exports.iniciarSesion = (req, res) => {
  const { usuario, contrasena } = req.body || {};
  const usuarioEsperado = process.env.ADMIN_USER || 'admin';
  const contrasenaEsperada = process.env.ADMIN_PASSWORD || 'admin123';
  if (!iguales(usuario, usuarioEsperado) || !iguales(contrasena, contrasenaEsperada)) {
    return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos.' });
  }
  const token = crypto.randomBytes(32).toString('hex');
  sesiones.set(token, Date.now() + DURACION_SESION);
  res.json({ token, usuario: usuarioEsperado });
};

exports.proteger = (req, res, next) => {
  const cabecera = req.get('authorization') || '';
  const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : '';
  const vence = sesiones.get(token);
  if (!vence || vence < Date.now()) {
    if (token) sesiones.delete(token);
    return res.status(401).json({ mensaje: 'Inicia sesión para continuar.' });
  }
  req.adminToken = token;
  next();
};

exports.cerrarSesion = (req, res) => {
  sesiones.delete(req.adminToken);
  res.json({ mensaje: 'Sesión cerrada.' });
};
