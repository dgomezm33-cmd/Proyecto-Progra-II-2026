const menu = document.querySelector('#menu');
const listaCarrito = document.querySelector('#carrito');
const total = document.querySelector('#total');
const vaciar = document.querySelector('#vaciar');
const busqueda = document.querySelector('#busqueda');
let platos = [];
let carrito = [];

const dinero = valor => `Q ${Number(valor).toFixed(2)}`;

function elemento(etiqueta, texto, clase) {
  const nodo = document.createElement(etiqueta);
  if (texto !== undefined) nodo.textContent = texto;
  if (clase) nodo.className = clase;
  return nodo;
}

function mostrarMenu() {
  const filtro = busqueda.value.trim().toLocaleLowerCase('es');
  const resultados = platos.filter(plato =>
    `${plato.nombre} ${plato.descripcion}`.toLocaleLowerCase('es').includes(filtro)
  );
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
  const item = carrito.find(producto => producto.plato_id === id);
  if (item) item.cantidad = Math.min(99, item.cantidad + cambio);
  else if (cambio > 0) carrito.push({ plato_id: id, cantidad: 1 });
  carrito = carrito.filter(producto => producto.cantidad > 0);
  mostrarCarrito();
}

function mostrarCarrito() {
  listaCarrito.replaceChildren();
  let centavos = 0;
  if (!carrito.length) listaCarrito.append(elemento('li', 'El carrito está vacío.', 'secundario'));
  carrito.forEach(item => {
    const plato = platos.find(producto => producto.id === item.plato_id);
    centavos += Math.round(Number(plato.precio) * 100) * item.cantidad;
    const fila = elemento('li');
    const controles = elemento('div', undefined, 'cantidad');
    const menos = elemento('button', '−');
    const mas = elemento('button', '+');
    menos.setAttribute('aria-label', `Quitar ${plato.nombre}`);
    mas.setAttribute('aria-label', `Agregar ${plato.nombre}`);
    menos.addEventListener('click', () => cambiarCantidad(plato.id, -1));
    mas.addEventListener('click', () => cambiarCantidad(plato.id, 1));
    controles.append(menos, elemento('span', String(item.cantidad)), mas, elemento('span', dinero(Number(plato.precio) * item.cantidad)));
    fila.append(elemento('strong', plato.nombre), controles);
    listaCarrito.append(fila);
  });
  total.textContent = dinero(centavos / 100);
  vaciar.disabled = carrito.length === 0;
}

async function cargarMenu() {
  try {
    const respuesta = await fetch('/api/platos');
    const datos = await respuesta.json();
    if (!respuesta.ok) throw new Error(datos.mensaje);
    platos = datos;
    mostrarMenu();
  } catch (error) {
    menu.replaceChildren(elemento('p', 'No se pudo cargar el menú.'));
    const aviso = document.querySelector('#mensaje');
    aviso.textContent = error.message || 'Revisa la conexión con el servidor.';
    aviso.hidden = false;
  }
}

busqueda.addEventListener('input', mostrarMenu);
vaciar.addEventListener('click', () => { carrito = []; mostrarCarrito(); });
mostrarCarrito();
cargarMenu();
