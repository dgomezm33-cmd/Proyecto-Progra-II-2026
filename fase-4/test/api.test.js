const { after, afterEach, before, test } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const db = require('../src/config/db');

let servidor;
let baseUrl;
const originales = { query: db.query, execute: db.execute, getConnection: db.getConnection };

before(async () => {
  await new Promise(resolve => {
    servidor = app.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${servidor.address().port}`;
      resolve();
    });
  });
});

afterEach(() => Object.assign(db, originales));
after(async () => {
  await new Promise((resolve, reject) => servidor.close(error => error ? reject(error) : resolve()));
  await db.end();
});

async function solicitar(ruta, opciones) {
  const respuesta = await fetch(`${baseUrl}${ruta}`, opciones);
  return { respuesta, datos: await respuesta.json() };
}

test('sirve la interfaz principal', async () => {
  const respuesta = await fetch(`${baseUrl}/`);
  assert.equal(respuesta.status, 200);
  assert.match(await respuesta.text(), /La Mesa/);
});

test('lista únicamente platos activos', async () => {
  const esperados = [{ id: 1, nombre: 'Limonada', categoria: 'Bebidas', precio: '10.00' }];
  db.query = async sql => {
    assert.match(sql, /activo = 1/);
    return [esperados];
  };
  const { respuesta, datos } = await solicitar('/api/platos');
  assert.equal(respuesta.status, 200);
  assert.deepEqual(datos, esperados);
});

test('rechaza un pedido vacío antes de consultar MySQL', async () => {
  db.getConnection = async () => { throw new Error('No debe conectarse'); };
  const { respuesta } = await solicitar('/api/pedidos', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cliente: '', productos: [] })
  });
  assert.equal(respuesta.status, 400);
});

test('actualiza un estado permitido', async () => {
  db.execute = async (sql, parametros) => {
    assert.match(sql, /UPDATE pedidos/);
    assert.deepEqual(parametros, ['entregado', 12]);
    return [{ affectedRows: 1 }];
  };
  const { respuesta, datos } = await solicitar('/api/pedidos/12/estado', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado: 'entregado' })
  });
  assert.equal(respuesta.status, 200);
  assert.equal(datos.mensaje, 'Estado actualizado.');
});

test('rechaza estados desconocidos', async () => {
  const { respuesta } = await solicitar('/api/pedidos/1/estado', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado: 'cancelado' })
  });
  assert.equal(respuesta.status, 400);
});
