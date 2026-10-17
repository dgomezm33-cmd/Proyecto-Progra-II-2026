const { after, afterEach, before, test } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const db = require('../src/config/db');

let servidor;
let baseUrl;
let adminHeaders;
const metodosOriginales = {
  query: db.query,
  execute: db.execute,
  getConnection: db.getConnection
};

before(async () => {
  await new Promise(resolve => {
    servidor = app.listen(0, '127.0.0.1', () => {
      const { port } = servidor.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
  const { datos } = await solicitar('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario: 'admin', contrasena: 'admin123' })
  });
  adminHeaders = { Authorization: `Bearer ${datos.token}` };
});

afterEach(() => Object.assign(db, metodosOriginales));

after(async () => {
  await new Promise((resolve, reject) => {
    servidor.close(error => error ? reject(error) : resolve());
  });
  await db.end();
});

async function solicitar(ruta, opciones) {
  const respuesta = await fetch(`${baseUrl}${ruta}`, opciones);
  const datos = await respuesta.json();
  return { respuesta, datos };
}

test('sirve la interfaz principal', async () => {
  const respuesta = await fetch(`${baseUrl}/`);
  assert.equal(respuesta.status, 200);
  assert.match(await respuesta.text(), /La Mesa/);
});

test('responde 404 en una ruta de API inexistente', async () => {
  const { respuesta, datos } = await solicitar('/api/no-existe');
  assert.equal(respuesta.status, 404);
  assert.equal(datos.mensaje, 'Ruta no encontrada.');
});

test('rechaza JSON mal formado', async () => {
  const { respuesta, datos } = await solicitar('/api/pedidos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"cliente":'
  });
  assert.equal(respuesta.status, 400);
  assert.equal(datos.mensaje, 'El JSON enviado no es válido.');
});

test('valida los datos antes de consultar la base', async () => {
  db.getConnection = async () => {
    throw new Error('No debería solicitar una conexión');
  };
  const { respuesta, datos } = await solicitar('/api/pedidos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cliente: '', productos: [] })
  });
  assert.equal(respuesta.status, 400);
  assert.match(datos.mensaje, /nombre de cliente/);
});

test('lista únicamente los platos activos', async () => {
  const esperados = [{ id: 1, nombre: 'Hamburguesa clásica', descripcion: 'Con papas', precio: '35.00' }];
  db.query = async sql => {
    assert.match(sql, /WHERE activo = 1/);
    return [esperados];
  };
  const { respuesta, datos } = await solicitar('/api/platos');
  assert.equal(respuesta.status, 200);
  assert.deepEqual(datos, esperados);
});

test('crea el pedido con precios de la base dentro de una transacción', async () => {
  const eventos = [];
  db.getConnection = async () => ({
    beginTransaction: async () => eventos.push('begin'),
    rollback: async () => eventos.push('rollback'),
    commit: async () => eventos.push('commit'),
    release: () => eventos.push('release'),
    execute: async (sql, parametros) => {
      if (sql.includes('FROM platos')) {
        eventos.push('precios');
        return [[{ id: 1, precio: '35.00', stock: 10 }]];
      }
      if (sql.startsWith('INSERT INTO pedidos')) {
        eventos.push(['pedido', parametros]);
        return [{ insertId: 17 }];
      }
      if (sql.startsWith('UPDATE platos SET stock')) {
        eventos.push(['stock', parametros]);
        return [{ affectedRows: 1 }];
      }
      eventos.push(['detalle', parametros]);
      return [{}];
    }
  });

  const { respuesta, datos } = await solicitar('/api/pedidos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cliente: '  Ana  ',
      notas: '  Sin cebolla  ',
      productos: [{ plato_id: 1, cantidad: 2 }],
      total: '0.01'
    })
  });

  assert.equal(respuesta.status, 201);
  assert.equal(datos.id, 17);
  assert.equal(datos.total, '70.00');
  assert.deepEqual(eventos, [
    'begin',
    'precios',
    ['pedido', ['Ana', 'Sin cebolla', '70.00']],
    ['detalle', [17, 1, 2, '35.00']],
    ['stock', [2, 1]],
    'commit',
    'release'
  ]);
});

test('revierte la transacción si un plato no está disponible', async () => {
  const eventos = [];
  db.getConnection = async () => ({
    beginTransaction: async () => eventos.push('begin'),
    execute: async () => [[]],
    rollback: async () => eventos.push('rollback'),
    release: () => eventos.push('release')
  });
  const { respuesta, datos } = await solicitar('/api/pedidos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cliente: 'Luis', productos: [{ plato_id: 99, cantidad: 1 }] })
  });
  assert.equal(respuesta.status, 400);
  assert.match(datos.mensaje, /ya no está disponible/);
  assert.deepEqual(eventos, ['begin', 'rollback', 'release']);
});

test('rechaza un pedido que supera las existencias disponibles', async () => {
  const eventos = [];
  db.getConnection = async () => ({
    beginTransaction: async () => eventos.push('begin'),
    execute: async sql => sql.includes('FROM platos') ? [[{ id: 1, precio: '35.00', stock: 1 }]] : [{}],
    rollback: async () => eventos.push('rollback'),
    release: () => eventos.push('release')
  });
  const { respuesta, datos } = await solicitar('/api/pedidos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cliente: 'Ana', productos: [{ plato_id: 1, cantidad: 2 }] })
  });
  assert.equal(respuesta.status, 400);
  assert.match(datos.mensaje, /existencias/);
  assert.deepEqual(eventos, ['begin', 'rollback', 'release']);
});

test('filtra pedidos por estado y fecha', async () => {
  db.execute = async (sql, parametros) => {
    assert.match(sql, /estado = \?/);
    assert.match(sql, /DATE\(fecha\) = \?/);
    assert.deepEqual(parametros, ['pendiente', '2026-10-17']);
    return [[]];
  };
  db.query = async () => [[]];
  const { respuesta, datos } = await solicitar('/api/pedidos?estado=pendiente&fecha=2026-10-17', {
    headers: adminHeaders
  });
  assert.equal(respuesta.status, 200);
  assert.deepEqual(datos, []);
});

test('rechaza estados de pedido desconocidos', async () => {
  db.execute = async () => {
    throw new Error('No debería ejecutar una consulta');
  };
  const { respuesta, datos } = await solicitar('/api/pedidos/1/estado', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...adminHeaders },
    body: JSON.stringify({ estado: 'cancelado' })
  });
  assert.equal(respuesta.status, 400);
  assert.match(datos.mensaje, /no es válido/);
});

test('actualiza un estado permitido', async () => {
  db.execute = async (sql, parametros) => {
    assert.match(sql, /UPDATE pedidos/);
    assert.deepEqual(parametros, ['entregado', 12]);
    return [{ affectedRows: 1 }];
  };
  const { respuesta, datos } = await solicitar('/api/pedidos/12/estado', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...adminHeaders },
    body: JSON.stringify({ estado: 'entregado' })
  });
  assert.equal(respuesta.status, 200);
  assert.equal(datos.mensaje, 'Estado actualizado.');
});

test('responde 404 al actualizar un pedido inexistente', async () => {
  db.execute = async () => [{ affectedRows: 0 }];
  const { respuesta, datos } = await solicitar('/api/pedidos/404/estado', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...adminHeaders },
    body: JSON.stringify({ estado: 'pendiente' })
  });
  assert.equal(respuesta.status, 404);
  assert.equal(datos.mensaje, 'Pedido no encontrado.');
});
