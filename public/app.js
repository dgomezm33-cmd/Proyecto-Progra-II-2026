const menu = document.querySelector('#menu');
const listaCarrito = document.querySelector('#carrito');
const listaPedidos = document.querySelector('#pedidos');
const confirmar = document.querySelector('#confirmar');
let platos = [];
let carrito = [];
let enviando = false;
const dinero = valor => `Q ${Number(valor).toFixed(2)}`;

// textContent permite mostrar nombres y notas sin interpretarlos como HTML.
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

async function cargarMenu() {
  try {
    platos = await api('/platos');
    menu.replaceChildren();
    if (!platos.length) menu.append(elemento('p', 'No hay platos disponibles.'));
    platos.forEach((plato, indice) => {
      const tarjeta = elemento('article', undefined, 'plato');
      const pie = elemento('div', undefined, 'pie-plato');
      const agregar = elemento('button', '+ Agregar');
      agregar.addEventListener('click', () => cambiarCantidad(plato.id, 1));
      pie.append(elemento('strong', dinero(plato.precio)), agregar);
      tarjeta.append(elemento('span', String(indice + 1).padStart(2, '0'), 'numero'), elemento('h2', plato.nombre), elemento('p', plato.descripcion), pie);
      menu.append(tarjeta);
    });
  } catch (error) {
    menu.replaceChildren(elemento('p', 'No se pudo cargar el menú.'));
    const reintentar = elemento('button', 'Reintentar', 'secundario-boton');
    reintentar.addEventListener('click', cargarMenu);
    menu.append(reintentar);
    mensaje(error.message, true);
  }
}

function cambiarCantidad(id, cambio) {
  if (enviando) return;
  const item = carrito.find(producto => producto.plato_id === id);
  if (item) item.cantidad = Math.min(99, item.cantidad + cambio);
  else if (cambio > 0) carrito.push({ plato_id: id, cantidad: 1 });
  carrito = carrito.filter(producto => producto.cantidad > 0);
  dibujarCarrito();
}

function dibujarCarrito() {
  listaCarrito.replaceChildren();
  let centavos = 0;
  if (!carrito.length) listaCarrito.append(elemento('li', 'Todavía no has agregado platos.', 'secundario'));
  carrito.forEach(item => {
    const plato = platos.find(plato => plato.id === item.plato_id);
    centavos += Math.round(Number(plato.precio) * 100) * item.cantidad;
    const fila = elemento('li');
    const controles = elemento('div', undefined, 'cantidad');
    const menos = elemento('button', '−');
    const mas = elemento('button', '+');
    menos.setAttribute('aria-label', `Quitar una unidad de ${plato.nombre}`);
    mas.setAttribute('aria-label', `Agregar una unidad de ${plato.nombre}`);
    menos.disabled = enviando;
    mas.disabled = enviando || item.cantidad >= 99;
    menos.addEventListener('click', () => cambiarCantidad(plato.id, -1));
    mas.addEventListener('click', () => cambiarCantidad(plato.id, 1));
    controles.append(menos, elemento('span', item.cantidad), mas, elemento('span', dinero(Number(plato.precio) * item.cantidad)));
    fila.append(elemento('strong', plato.nombre), controles);
    listaCarrito.append(fila);
  });
  document.querySelector('#total').textContent = dinero(centavos / 100);
  confirmar.disabled = enviando || !carrito.length;
  confirmar.textContent = enviando ? 'Registrando…' : 'Confirmar pedido';
}

document.querySelector('#form-pedido').addEventListener('submit', async evento => {
  evento.preventDefault();
  if (enviando || !carrito.length) return;
  enviando = true;
  dibujarCarrito();
  try {
    const pedido = await api('/pedidos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cliente: document.querySelector('#cliente').value, notas: document.querySelector('#notas').value, productos: carrito })
    });
    carrito = [];
    evento.target.reset();
    mensaje(`¡Pedido #${pedido.id} registrado! Total: ${dinero(pedido.total)}. Puedes consultarlo en Pedidos.`);
  } catch (error) {
    mensaje(error.message, true);
  } finally {
    enviando = false;
    dibujarCarrito();
  }
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
      selector.id = `estado-${pedido.id}`;
      ['pendiente', 'en preparación', 'entregado'].forEach(valor => {
        const opcion = elemento('option', valor);
        opcion.value = valor;
        selector.append(opcion);
      });
      selector.value = pedido.estado;
      selector.addEventListener('change', async () => {
        selector.disabled = true;
        try {
          await api(`/pedidos/${pedido.id}/estado`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: selector.value }) });
          pedido.estado = selector.value;
          estado.textContent = pedido.estado;
          mensaje(`Estado del pedido #${pedido.id} actualizado.`);
        } catch (error) {
          selector.value = pedido.estado;
          mensaje(error.message, true);
        } finally {
          selector.disabled = false;
        }
      });
      const etiqueta = elemento('label', 'Estado del pedido');
      etiqueta.htmlFor = selector.id;
      tarjeta.append(cabecera, elemento('p', pedido.cliente), elemento('p', new Date(pedido.fecha).toLocaleString('es-GT'), 'secundario'), detalles);
      if (pedido.notas) tarjeta.append(elemento('p', `Indicaciones: ${pedido.notas}`));
      tarjeta.append(elemento('strong', `Total: ${dinero(pedido.total)}`), etiqueta, selector);
      listaPedidos.append(tarjeta);
    });
  } catch (error) {
    listaPedidos.replaceChildren(elemento('p', 'No se pudieron cargar los pedidos. Intenta actualizar la lista.'));
    mensaje(error.message, true);
  } finally {
    actualizar.disabled = false;
  }
}

for (const vista of ['menu', 'pedidos']) {
  document.querySelector(`#ver-${vista}`).addEventListener('click', () => {
    for (const nombre of ['menu', 'pedidos']) {
      const activo = nombre === vista;
      document.querySelector(`#vista-${nombre}`).hidden = !activo;
      const boton = document.querySelector(`#ver-${nombre}`);
      boton.classList.toggle('activo', activo);
      boton.setAttribute('aria-pressed', String(activo));
    }
    if (vista === 'pedidos' && !document.querySelector('#actualizar').disabled) cargarPedidos();
  });
}
document.querySelector('#actualizar').addEventListener('click', cargarPedidos);
dibujarCarrito();
cargarMenu();
