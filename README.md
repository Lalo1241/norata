# Notara

Tu vida como videojuego: misiones que haces hoy, habilidades que suben con la
práctica, talentos que compras con dinero real y proyectos que avanzan por
etapas.

Es una aplicación web sin compilación y sin dependencias: archivos sueltos que
el navegador entiende tal cual. No hay `npm install`, ni empaquetador, ni paso
previo — se editan los archivos y se recarga.

Lo que sí hace falta es servirla por HTTP (`python -m http.server`, por
ejemplo). Abrir `index.html` con doble clic ya no funciona desde que dejó de
ser un solo archivo.

## Cómo se usa

Lo primero es la pantalla de entrada. Hay dos caminos: iniciar sesión (o crear
una cuenta con tu correo) o **probar sin cuenta**.

Sin cuenta la app funciona entera, pero tu progreso se queda en ese navegador.
Crear la cuenta después no pierde nada: lo que ya tienes en el dispositivo es
justo lo que sube a la cuenta nueva.

Desde el móvil o el escritorio se puede instalar como aplicación ("Añadir a
pantalla de inicio" / "Instalar"), y a partir de ahí abre sin conexión.

## Dónde viven tus datos

Siempre en el navegador del dispositivo. Si iniciaste sesión, además en tu
cuenta, para que la computadora y el teléfono vean lo mismo.

Nadie puede ver los datos de otra persona, y eso no lo garantiza el código de
la app sino una regla dentro de la base de datos: solo entrega la fila cuyo
dueño coincide con quien pregunta. Aunque la app tuviera un fallo, o alguien
la modificara en su propio navegador, la base no suelta nada ajeno.

Tu contraseña no se guarda en el dispositivo. Se cambia una vez por una sesión
que caduca y se renueva sola.

### Qué esperar

La sincronía ocurre sola al abrir la app, al volver a la pestaña y al
recuperar la conexión. Después de un cambio espera unos segundos antes de
subirlo, para que una tarde de uso sean unos pocos envíos y no cien.

### Si dos dispositivos cambian lo mismo

La app no elige por ti. Te dice qué hay de cada lado y cuándo se guardó, y tú
decides cuál se queda. El lado que no elijas se guarda como copia en el
navegador antes de tocar nada, así que no se pierde.

Esas copias se ven y se recuperan desde **Ajustes → Copias de seguridad
automáticas**, con su fecha y lo que contenía cada una. Se conservan las cinco
más recientes; restaurar una aparta antes lo que tengas ahora, por si te
arrepientes.

### Dos cuentas: la real y la de pruebas

En **Ajustes → Sincronizar** cada cuenta se marca como real o de pruebas. En
la de pruebas verás un marco punteado amarillo rodeando la pantalla mientras
la uses. En la real, borrar todo te pide escribir tu correo — obliga a mirar
en cuál estás antes de vaciarla.

## Respaldos

En **Ajustes → Tus datos** puedes exportar un JSON y volver a importarlo.
Funciona sin conexión y sin depender de ninguna cuenta, así que sigue siendo
buena idea aunque uses la sincronía.

Si el navegador se queda sin espacio para guardar, la app te lo dice y te
ofrece exportar ahí mismo, en vez de perder el cambio en silencio. Y si algo
revienta, aparece un aviso abajo con un botón para sacar el respaldo antes de
recargar — nunca una pantalla en blanco sin explicación.

## Estructura

| Archivo | Qué es |
| --- | --- |
| `index.html` | El marcado de todas las pantallas, y la red de seguridad ante errores |
| `css/fuente.css` | Solo la tipografía incrustada. Aparte porque es lo único que no cambia nunca |
| `css/estilos.css` | Todo lo demás del aspecto |
| `js/01…11-*.js` | La aplicación, por áreas. **El orden importa**: se ejecutan uno tras otro |
| `sw.js` | Service worker; guarda la app para que abra sin conexión |
| `manifest.webmanifest` | Metadatos para poder instalarla |
| `icon*.png`, `apple-touch-icon.png` | Iconos de la app instalada |
| `icon.svg`, `favicon.svg` | Icono vectorial y el de la pestaña |
| `marca/` | Logos sueltos y el script que los regenera desde la app |

Los `js/` son *scripts* normales, no módulos, y por eso sus funciones son
globales: los `onclick` del HTML dependen de ello. Van sin `defer` y en el
orden numerado, que es exactamente el que tenían cuando eran un solo bloque —
cambiarlo rompe las dependencias entre piezas. `11-arranque.js` va el último
porque es lo único que se ejecuta al abrir, en vez de solo declarar cosas.

`10-sincronia.js` no sabe dónde viven los datos: habla con un *almacén*, y
`10b-supabase.js` es el único que hay hoy. Esa separación nació de la
mudanza desde GitHub, y se ganó quedarse: la mudanza no obligó a tocar ni
una línea de la sincronía —ni la espera que agrupa cambios, ni la
resolución de conflictos, ni las copias—, que es justo la parte capaz de
perder progreso si se rompe.

El service worker solo se registra sobre HTTPS, así que servirla en local no
activa el modo sin conexión. Es a propósito: evita quedarse con una versión
vieja en caché mientras se trabaja en el código.
