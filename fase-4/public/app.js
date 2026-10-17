const menu = document.querySelector('#menu');
const listaCarrito = document.querySelector('#carrito');
const listaPedidos = document.querySelector('#pedidos');
const confirmar = document.querySelector('#confirmar');
const busqueda = document.querySelector('#busqueda');
const imagenes = ['hamburguesa.png', 'pizza.png', 'tacos.png', 'ensalada.png', 'limonada.png', 'brownie.png'];
let platos = [];
let productosAdmin = [];
let enviando = false;
let carrito = cargarCarrito();
let tokenAdmin = sessionStorage.getItem('la-mesa-admin') || '';
let archivoImagen = null;
let urlVistaImagen = '';

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

function rutaImagen(plato) {
  return plato.imagen || `/images/menu/${imagenes[plato.id - 1] || 'hamburguesa.png'}`;
}

function mostrarVistaImagen(ruta) {
  const vista = document.querySelector('#vista-imagen');
  vista.src = ruta;
  vista.hidden = false;
  document.querySelector('#indicacion-imagen').hidden = true;
}

function limpiarVistaImagen() {
  if (urlVistaImagen) URL.revokeObjectURL(urlVistaImagen);
  urlVistaImagen = '';
  archivoImagen = null;
  document.querySelector('#producto-archivo').value = '';
  const vista = document.querySelector('#vista-imagen');
  vista.removeAttribute('src');
  vista.hidden = true;
  document.querySelector('#indicacion-imagen').hidden = false;
}

function seleccionarImagen(archivo) {
  const tipos = ['image/jpeg', 'image/png', 'image/webp'];
  if (!archivo || !tipos.includes(archivo.type)) return mensaje('Selecciona una imagen JPG, PNG o WebP.', true);
  if (archivo.size > 5 * 1024 * 1024) return mensaje('La imagen debe pesar como máximo 5 MB.', true);
  if (urlVistaImagen) URL.revokeObjectURL(urlVistaImagen);
  archivoImagen = archivo;
  urlVistaImagen = URL.createObjectURL(archivo);
  mostrarVistaImagen(urlVistaImagen);
}

function mensaje(texto, error = false) {
  const aviso = document.querySelector('#mensaje');
  aviso.textContent = texto;
  aviso.className = error ? 'error' : '';
  aviso.hidden = false;
  aviso.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function solicitud(ruta, opciones = {}) {
  const respuesta = await fetch(`/api${ruta}`, opciones);
  const datos = await respuesta.json();
  if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudo completar la solicitud.');
  return datos;
}

async function adminApi(ruta, opciones = {}) {
  const headers = new Headers(opciones.headers || {});
  headers.set('Authorization', `Bearer ${tokenAdmin}`);
  const respuesta = await fetch(`/api${ruta}`, { ...opciones, headers });
  const datos = await respuesta.json();
  if (respuesta.status === 401) {
    salirDelPanel();
    throw new Error(datos.mensaje || 'La sesión terminó.');
  }
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
    imagen.src = rutaImagen(plato);
    imagen.alt = plato.nombre;
    imagen.loading = 'lazy';
    const pie = elemento('div', undefined, 'pie');
    const agregar = elemento('button', '+ Agregar');
    const disponibles = Number(plato.stock);
    const existencia = elemento('span', disponibles > 0 ? `${disponibles} disponibles` : 'Agotado', `existencias${disponibles > 0 ? '' : ' agotado'}`);
    agregar.disabled = disponibles < 1;
    agregar.addEventListener('click', () => cambiarCantidad(plato.id, 1));
    pie.append(elemento('strong', dinero(plato.precio)), agregar);
    tarjeta.append(imagen, elemento('span', plato.categoria, 'categoria'), elemento('h2', plato.nombre), elemento('p', plato.descripcion), existencia, pie);
    menu.append(tarjeta);
  });
}

async function cargarMenu() {
  try {
    platos = await solicitud('/platos');
    mostrarMenu();
    mostrarCarrito();
  } catch (error) {
    menu.replaceChildren(elemento('p', 'No se pudo cargar el menú.'));
    mensaje(error.message, true);
  }
}

function cambiarCantidad(id, cambio) {
  if (enviando) return;
  const plato = platos.find(producto => producto.id === id);
  if (!plato || Number(plato.stock) < 1) return;
  const item = carrito.find(producto => producto.plato_id === id);
  if (item) item.cantidad = Math.min(99, Number(plato.stock), item.cantidad + cambio);
  else if (cambio > 0) carrito.push({ plato_id: id, cantidad: 1 });
  carrito = carrito.filter(producto => producto.cantidad > 0);
  guardarCarrito();
  mostrarCarrito();
}

function mostrarCarrito() {
  listaCarrito.replaceChildren();
  carrito = carrito.filter(item => platos.some(plato => plato.id === item.plato_id && Number(plato.stock) > 0));
  carrito.forEach(item => {
    const plato = platos.find(producto => producto.id === item.plato_id);
    item.cantidad = Math.min(item.cantidad, Number(plato.stock));
  });
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
    const pedido = await solicitud('/pedidos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cliente: document.querySelector('#cliente').value, notas: document.querySelector('#notas').value, productos: carrito })
    });
    carrito = [];
    guardarCarrito();
    evento.target.reset();
    await cargarMenu();
    mensaje(`¡Pedido #${pedido.id} registrado! Total: ${dinero(pedido.total)}.`);
  } catch (error) { mensaje(error.message, true); }
  finally { enviando = false; mostrarCarrito(); }
});

function mostrarAcceso() {
  document.querySelector('#acceso-admin').hidden = false;
  document.querySelector('#panel-admin').hidden = true;
  document.querySelector('#contrasena').value = '';
}

function mostrarPanel() {
  document.querySelector('#acceso-admin').hidden = true;
  document.querySelector('#panel-admin').hidden = false;
}

function salirDelPanel() {
  tokenAdmin = '';
  sessionStorage.removeItem('la-mesa-admin');
  mostrarAcceso();
}

document.querySelector('#form-login').addEventListener('submit', async evento => {
  evento.preventDefault();
  const boton = document.querySelector('#entrar');
  const error = document.querySelector('#error-login');
  boton.disabled = true;
  error.hidden = true;
  try {
    const datos = await solicitud('/admin/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario: document.querySelector('#usuario').value, contrasena: document.querySelector('#contrasena').value })
    });
    tokenAdmin = datos.token;
    sessionStorage.setItem('la-mesa-admin', tokenAdmin);
    mostrarPanel();
    cambiarSeccionAdmin('pedidos');
  } catch (fallo) {
    error.textContent = fallo.message;
    error.hidden = false;
  } finally { boton.disabled = false; }
});

document.querySelector('#cerrar-sesion').addEventListener('click', async () => {
  try { await adminApi('/admin/logout', { method: 'DELETE' }); } catch {}
  salirDelPanel();
});

async function cargarPedidos() {
  const actualizar = document.querySelector('#actualizar');
  actualizar.disabled = true;
  listaPedidos.replaceChildren(elemento('p', 'Cargando pedidos…'));
  try {
    const parametros = new URLSearchParams();
    const estadoFiltrado = document.querySelector('#filtro-estado').value;
    const fechaFiltrada = document.querySelector('#filtro-fecha').value;
    if (estadoFiltrado) parametros.set('estado', estadoFiltrado);
    if (fechaFiltrada) parametros.set('fecha', fechaFiltrada);
    const pedidos = await adminApi(`/pedidos${parametros.size ? `?${parametros}` : ''}`);
    await cargarResumen();
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
          await adminApi(`/pedidos/${pedido.id}/estado`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: selector.value }) });
          pedido.estado = selector.value;
          estado.textContent = pedido.estado;
          await cargarResumen();
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

async function cargarResumen() {
  try {
    const datos = await adminApi('/admin/resumen');
    document.querySelector('#resumen-pedidos').textContent = datos.pedidos_hoy;
    document.querySelector('#resumen-ventas').textContent = dinero(datos.ventas_hoy);
    document.querySelector('#resumen-pendientes').textContent = datos.pendientes;
    document.querySelector('#resumen-preparacion').textContent = datos.en_preparacion;
    document.querySelector('#resumen-stock').textContent = datos.stock_bajo;
  } catch (error) { mensaje(error.message, true); }
}

function limpiarFormularioProducto() {
  document.querySelector('#form-producto').reset();
  document.querySelector('#producto-id').value = '';
  document.querySelector('#producto-activo').checked = true;
  document.querySelector('#producto-stock').value = '0';
  document.querySelector('#campo-activo').hidden = true;
  document.querySelector('#cancelar-edicion').hidden = true;
  document.querySelector('#titulo-form-producto').textContent = 'Nuevo producto';
  document.querySelector('#guardar-producto').textContent = 'Guardar producto';
  limpiarVistaImagen();
}

function editarProducto(producto) {
  document.querySelector('#producto-id').value = producto.id;
  document.querySelector('#producto-nombre').value = producto.nombre;
  document.querySelector('#producto-descripcion').value = producto.descripcion;
  document.querySelector('#producto-categoria').value = producto.categoria;
  document.querySelector('#producto-precio').value = Number(producto.precio).toFixed(2);
  document.querySelector('#producto-imagen').value = producto.imagen || '';
  limpiarVistaImagen();
  if (producto.imagen) mostrarVistaImagen(producto.imagen);
  document.querySelector('#producto-stock').value = producto.stock;
  document.querySelector('#producto-activo').checked = Boolean(producto.activo);
  document.querySelector('#campo-activo').hidden = false;
  document.querySelector('#cancelar-edicion').hidden = false;
  document.querySelector('#titulo-form-producto').textContent = `Editar producto #${producto.id}`;
  document.querySelector('#guardar-producto').textContent = 'Guardar cambios';
  document.querySelector('#form-producto').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function dibujarProductosAdmin() {
  const contenedor = document.querySelector('#productos-admin');
  contenedor.replaceChildren();
  if (!productosAdmin.length) contenedor.append(elemento('p', 'No hay productos registrados.'));
  productosAdmin.forEach(producto => {
    const tarjeta = elemento('article', undefined, `producto-admin${producto.activo ? '' : ' inactivo'}`);
    const imagen = elemento('img', undefined, 'miniatura-producto');
    imagen.src = rutaImagen(producto);
    imagen.alt = '';
    const datos = elemento('div', undefined, 'datos-producto');
    datos.append(elemento('h3', producto.nombre), elemento('p', `${producto.categoria} · ${dinero(producto.precio)}`, 'secundario'), elemento('p', `${producto.stock} existencias`, Number(producto.stock) <= 5 ? 'stock-bajo' : 'existencias'));
    if (!producto.activo) datos.append(elemento('span', 'Fuera del menú', 'insignia-inactiva'));
    const acciones = elemento('div', undefined, 'acciones-producto');
    const editar = elemento('button', 'Editar');
    const retirar = elemento('button', producto.activo ? 'Retirar' : 'Reactivar', producto.activo ? 'peligro' : 'reactivar');
    editar.addEventListener('click', () => editarProducto(producto));
    retirar.addEventListener('click', async () => {
      const accion = producto.activo ? 'retirar' : 'reactivar';
      if (!confirm(`¿${producto.activo ? 'Retirar' : 'Reactivar'} “${producto.nombre}” ${producto.activo ? 'del' : 'en el'} menú?`)) return;
      try {
        await adminApi(`/admin/platos/${producto.id}${producto.activo ? '' : '/reactivar'}`, { method: producto.activo ? 'DELETE' : 'PATCH' });
        mensaje(`Producto ${accion === 'retirar' ? 'retirado del' : 'reactivado en el'} menú.`);
        await Promise.all([cargarProductos(), cargarMenu(), cargarResumen()]);
      } catch (error) { mensaje(error.message, true); }
    });
    acciones.append(editar, retirar);
    tarjeta.append(imagen, datos, acciones);
    contenedor.append(tarjeta);
  });
}

async function cargarProductos() {
  const contenedor = document.querySelector('#productos-admin');
  contenedor.replaceChildren(elemento('p', 'Cargando productos…'));
  try {
    productosAdmin = await adminApi('/admin/platos');
    dibujarProductosAdmin();
  } catch (error) {
    contenedor.replaceChildren(elemento('p', 'No se pudieron cargar los productos.'));
    mensaje(error.message, true);
  }
}

document.querySelector('#form-producto').addEventListener('submit', async evento => {
  evento.preventDefault();
  if (!evento.target.reportValidity()) return;
  const id = document.querySelector('#producto-id').value;
  const datos = {
    nombre: document.querySelector('#producto-nombre').value,
    descripcion: document.querySelector('#producto-descripcion').value,
    categoria: document.querySelector('#producto-categoria').value,
    precio: document.querySelector('#producto-precio').value,
    imagen: document.querySelector('#producto-imagen').value,
    stock: Number(document.querySelector('#producto-stock').value),
    activo: document.querySelector('#producto-activo').checked
  };
  const boton = document.querySelector('#guardar-producto');
  boton.disabled = true;
  try {
    if (archivoImagen) {
      const subida = await adminApi('/admin/imagenes', { method: 'POST', headers: { 'Content-Type': archivoImagen.type }, body: archivoImagen });
      datos.imagen = subida.ruta;
    }
    await adminApi(id ? `/admin/platos/${id}` : '/admin/platos', {
      method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos)
    });
    mensaje(id ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.');
    limpiarFormularioProducto();
    await Promise.all([cargarProductos(), cargarMenu(), cargarResumen()]);
  } catch (error) { mensaje(error.message, true); }
  finally { boton.disabled = false; }
});

document.querySelector('#cancelar-edicion').addEventListener('click', limpiarFormularioProducto);

const zonaImagen = document.querySelector('#zona-imagen');
const selectorImagen = document.querySelector('#producto-archivo');
document.querySelector('#elegir-imagen').addEventListener('click', evento => {
  evento.stopPropagation();
  selectorImagen.click();
});
zonaImagen.addEventListener('click', () => selectorImagen.click());
zonaImagen.addEventListener('keydown', evento => {
  if (evento.key === 'Enter' || evento.key === ' ') {
    evento.preventDefault();
    selectorImagen.click();
  }
});
selectorImagen.addEventListener('change', () => seleccionarImagen(selectorImagen.files[0]));
zonaImagen.addEventListener('dragover', evento => {
  evento.preventDefault();
  zonaImagen.classList.add('arrastrando');
});
zonaImagen.addEventListener('dragleave', () => zonaImagen.classList.remove('arrastrando'));
zonaImagen.addEventListener('drop', evento => {
  evento.preventDefault();
  zonaImagen.classList.remove('arrastrando');
  seleccionarImagen(evento.dataTransfer.files[0]);
});
document.querySelector('#producto-imagen').addEventListener('change', evento => {
  if (!evento.target.value.trim()) return;
  limpiarVistaImagen();
  mostrarVistaImagen(evento.target.value.trim());
});

function cambiarSeccionAdmin(nombre) {
  for (const seccion of ['pedidos', 'productos']) {
    const activa = seccion === nombre;
    document.querySelector(`#admin-${seccion}`).hidden = !activa;
    document.querySelector(`#tab-${seccion}`).classList.toggle('activo', activa);
    document.querySelector(`#tab-${seccion}`).setAttribute('aria-selected', String(activa));
  }
  if (nombre === 'pedidos') cargarPedidos();
  else cargarProductos();
}

document.querySelector('#tab-pedidos').addEventListener('click', () => cambiarSeccionAdmin('pedidos'));
document.querySelector('#tab-productos').addEventListener('click', () => cambiarSeccionAdmin('productos'));
document.querySelector('#actualizar').addEventListener('click', cargarPedidos);
document.querySelector('#filtro-estado').addEventListener('change', cargarPedidos);
document.querySelector('#filtro-fecha').addEventListener('change', cargarPedidos);
document.querySelector('#limpiar-filtros').addEventListener('click', () => {
  document.querySelector('#filtro-estado').value = '';
  document.querySelector('#filtro-fecha').value = '';
  cargarPedidos();
});
busqueda.addEventListener('input', mostrarMenu);

for (const vista of ['menu', 'pedidos']) {
  document.querySelector(`#ver-${vista}`).addEventListener('click', () => {
    for (const nombre of ['menu', 'pedidos']) {
      const activa = nombre === vista;
      document.querySelector(`#vista-${nombre}`).hidden = !activa;
      document.querySelector(`#ver-${nombre}`).classList.toggle('activo', activa);
      document.querySelector(`#ver-${nombre}`).setAttribute('aria-pressed', String(activa));
    }
    if (vista === 'pedidos') {
      if (tokenAdmin) {
        mostrarPanel();
        cambiarSeccionAdmin('pedidos');
      } else mostrarAcceso();
    }
  });
}

cargarMenu();
