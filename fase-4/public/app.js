const menu = document.querySelector('#menu');
const listaCarrito = document.querySelector('#carrito');
const listaPedidos = document.querySelector('#pedidos');
const confirmar = document.querySelector('#confirmar');
const busqueda = document.querySelector('#busqueda');
let platos = [];
let enviando = false;
let carrito = cargarCarrito();

const dinero = valor => `Q ${Number(valor).toFixed(2)}`;

function cargarCarrito() {
  try {
    const guardado = JSON.parse(localStorage.getItem('la-mesa-carrito'));
    return Array.isArray(guardado) ? guardado : [];
  } catch { return []; }
}

function guardarCarrito() {
  localStorage.setItem('la-mesa-carrito', JSON.stringify(carrito));
}

function elemento(etiqueta, texto, clase) {
  const nodo = document.createElement(etiqueta);
  if (texto !== undefined) nodo.textContent = texto;
  if (clase) nodo.className = clase;
  return nodo;
}

function mensaje(texto, error = false) {
  const aviso = document.querySelector('#mensaje');
  aviso.textContent = texto;
  aviso.className = error ? 'error' : '';
  aviso.hidden = false;
}

async function api(ruta, opciones) {
  const respuesta = await fetch(`/api${ruta}`, opciones);
  const datos = await respuesta.json();
  if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudo completar la solicitud.');
  return datos;
}

function mostrarMenu() {
  const filtro = busqueda.value.trim().toLocaleLowerCase('es');
  const resultados = platos.filter(plato => `${plato.nombre} ${plato.descripcion}`.toLocaleLowerCase('es').includes(filtro));
  menu.replaceChildren();
  if (!resultados.length) menu.append(elemento('p', 'No se encontraron platos.'));
  resultados.forEach(plato => {
    const tarjeta = elemento('article', undefined, 'plato');
    const pie = elemento('div', undefined, 'pie');
    const agregar = elemento('button', '+ Agregar');
    agregar.addEventListener('click', () => cambiarCantidad(plato.id, 1));
    pie.append(elemento('strong', dinero(plato.precio)), agregar);
    tarjeta.append(elemento('span', plato.categoria, 'categoria'), elemento('h2', plato.nombre), elemento('p', plato.descripcion), pie);
    menu.append(tarjeta);
  });
}

function cambiarCantidad(id, cambio) {
  if (enviando) return;
  const item = carrito.find(producto => producto.plato_id === id);
  if (item) item.cantidad = Math.min(99, item.cantidad + cambio);
  else if (cambio > 0) carrito.push({ plato_id: id, cantidad: 1 });
  carrito = carrito.filter(producto => producto.cantidad > 0);
  guardarCarrito();
  mostrarCarrito();
}

function mostrarCarrito() {
  listaCarrito.replaceChildren();
  carrito = carrito.filter(item => platos.some(plato => plato.id === item.plato_id));
  guardarCarrito();
  let centavos = 0;
  if (!carrito.length) listaCarrito.append(elemento('li', 'Todavía no has agregado platos.', 'secundario'));
  carrito.forEach(item => {
    const plato = platos.find(producto => producto.id === item.plato_id);
    centavos += Math.round(Number(plato.precio) * 100) * item.cantidad;
    const fila = elemento('li');
    const controles = elemento('div', undefined, 'cantidad');
    const menos = elemento('button', '−');
    const mas = elemento('button', '+');
    menos.setAttribute('aria-label', `Quitar ${plato.nombre}`);
    mas.setAttribute('aria-label', `Agregar ${plato.nombre}`);
    menos.disabled = enviando;
    mas.disabled = enviando || item.cantidad >= 99;
    menos.addEventListener('click', () => cambiarCantidad(plato.id, -1));
    mas.addEventListener('click', () => cambiarCantidad(plato.id, 1));
    controles.append(menos, elemento('span', String(item.cantidad)), mas, elemento('span', dinero(Number(plato.precio) * item.cantidad)));
    fila.append(elemento('strong', plato.nombre), controles);
    listaCarrito.append(fila);
  });
  document.querySelector('#total').textContent = dinero(centavos / 100);
  confirmar.disabled = enviando || carrito.length === 0;
  confirmar.textContent = enviando ? 'Registrando…' : 'Confirmar pedido';
}

document.querySelector('#form-pedido').addEventListener('submit', async evento => {
  evento.preventDefault();
  if (enviando || !carrito.length || !evento.target.reportValidity()) return;
  enviando = true;
  mostrarCarrito();
  try {
    const pedido = await api('/pedidos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cliente: document.querySelector('#cliente').value, notas: document.querySelector('#notas').value, productos: carrito })
    });
    carrito = [];
    guardarCarrito();
    evento.target.reset();
    mensaje(`¡Pedido #${pedido.id} registrado! Total: ${dinero(pedido.total)}.`);
  } catch (error) { mensaje(error.message, true); }
  finally { enviando = false; mostrarCarrito(); }
});

async function cargarPedidos() {
  const actualizar = document.querySelector('#actualizar');
  actualizar.disabled = true;
  listaPedidos.replaceChildren(elemento('p', 'Cargando pedidos…'));
  try {
    const pedidos = await api('/pedidos');
    listaPedidos.replaceChildren();
    if (!pedidos.length) listaPedidos.append(elemento('p', 'Todavía no hay pedidos registrados.'));
    pedidos.forEach(pedido => {
      const tarjeta = elemento('article', undefined, 'pedido');
      const cabecera = elemento('div', undefined, 'encabezado-pedido');
      const estado = elemento('span', pedido.estado, 'estado');
      cabecera.append(elemento('h2', `Pedido #${pedido.id}`), estado);
      const detalles = elemento('ul');
      pedido.detalles.forEach(item => detalles.append(elemento('li', `${item.cantidad} × ${item.nombre} · ${dinero(item.cantidad * Number(item.precio_unitario))}`)));
      const selector = elemento('select');
      selector.setAttribute('aria-label', `Estado del pedido ${pedido.id}`);
      ['pendiente', 'en preparación', 'entregado'].forEach(valor => {
        const opcion = elemento('option', valor);
        opcion.value = valor;
        selector.append(opcion);
      });
      selector.value = pedido.estado;
      selector.addEventListener('change', async () => {
        const anterior = pedido.estado;
        selector.disabled = true;
        try {
          await api(`/pedidos/${pedido.id}/estado`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: selector.value }) });
          pedido.estado = selector.value;
          estado.textContent = pedido.estado;
          mensaje(`Estado del pedido #${pedido.id} actualizado.`);
        } catch (error) { selector.value = anterior; mensaje(error.message, true); }
        finally { selector.disabled = false; }
      });
      tarjeta.append(cabecera, elemento('p', pedido.cliente), elemento('p', new Date(pedido.fecha).toLocaleString('es-GT'), 'secundario'), detalles);
      if (pedido.notas) tarjeta.append(elemento('p', `Indicaciones: ${pedido.notas}`));
      tarjeta.append(elemento('strong', `Total: ${dinero(pedido.total)}`), elemento('p', 'Estado'), selector);
      listaPedidos.append(tarjeta);
    });
  } catch (error) {
    listaPedidos.replaceChildren(elemento('p', 'No se pudieron cargar los pedidos.'));
    mensaje(error.message, true);
  } finally { actualizar.disabled = false; }
}

for (const vista of ['menu', 'pedidos']) {
  document.querySelector(`#ver-${vista}`).addEventListener('click', () => {
    for (const nombre of ['menu', 'pedidos']) {
      const activo = nombre === vista;
      document.querySelector(`#vista-${nombre}`).hidden = !activo;
      document.querySelector(`#ver-${nombre}`).classList.toggle('activo', activo);
      document.querySelector(`#ver-${nombre}`).setAttribute('aria-pressed', String(activo));
    }
    if (vista === 'pedidos') cargarPedidos();
  });
}

document.querySelector('#actualizar').addEventListener('click', cargarPedidos);
busqueda.addEventListener('input', mostrarMenu);
(async () => {
  try {
    platos = await api('/platos');
    mostrarMenu();
    mostrarCarrito();
  } catch (error) {
    menu.replaceChildren(elemento('p', 'No se pudo cargar el menú.'));
    mensaje(error.message, true);
  }
})();
