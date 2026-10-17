const menu = document.querySelector('#menu');
const listaCarrito = document.querySelector('#carrito');
const confirmar = document.querySelector('#confirmar');
const busqueda = document.querySelector('#busqueda');
let platos = [];
let enviando = false;
let carrito = cargarCarrito();
const imagenes = ['hamburguesa.png', 'pizza.png', 'tacos.png', 'ensalada.png', 'limonada.png', 'brownie.png'];

const dinero = valor => `Q ${Number(valor).toFixed(2)}`;

function cargarCarrito() {
  try {
    const guardado = JSON.parse(localStorage.getItem('la-mesa-carrito'));
    return Array.isArray(guardado) ? guardado : [];
  } catch {
    return [];
  }
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
    const imagen = elemento('img', undefined, 'imagen-plato');
    imagen.src = `/images/menu/${imagenes[plato.id - 1] || 'hamburguesa.png'}`;
    imagen.alt = plato.nombre;
    imagen.loading = 'lazy';
    const pie = elemento('div', undefined, 'pie');
    const agregar = elemento('button', '+ Agregar');
    agregar.addEventListener('click', () => cambiarCantidad(plato.id, 1));
    pie.append(elemento('strong', dinero(plato.precio)), agregar);
    tarjeta.append(imagen, elemento('span', plato.categoria, 'categoria'), elemento('h2', plato.nombre), elemento('p', plato.descripcion), pie);
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
  let centavos = 0;
  const disponibles = carrito.filter(item => platos.some(plato => plato.id === item.plato_id));
  if (disponibles.length !== carrito.length) {
    carrito = disponibles;
    guardarCarrito();
  }
  if (!carrito.length) listaCarrito.append(elemento('li', 'Todavía no has agregado platos.', 'secundario'));
  carrito.forEach(item => {
    const plato = platos.find(producto => producto.id === item.plato_id);
    centavos += Math.round(Number(plato.precio) * 100) * item.cantidad;
    const fila = elemento('li');
    const controles = elemento('div', undefined, 'cantidad');
    const menos = elemento('button', '−');
    const mas = elemento('button', '+');
    menos.addEventListener('click', () => cambiarCantidad(plato.id, -1));
    mas.addEventListener('click', () => cambiarCantidad(plato.id, 1));
    menos.disabled = enviando;
    mas.disabled = enviando || item.cantidad >= 99;
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente: document.querySelector('#cliente').value,
        notas: document.querySelector('#notas').value,
        productos: carrito
      })
    });
    carrito = [];
    guardarCarrito();
    evento.target.reset();
    mensaje(`Pedido #${pedido.id} registrado. Total: ${dinero(pedido.total)}.`);
  } catch (error) {
    mensaje(error.message, true);
  } finally {
    enviando = false;
    mostrarCarrito();
  }
});

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
