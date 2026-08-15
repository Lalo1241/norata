# Notara

Tu vida como videojuego: misiones que haces hoy, habilidades que suben con la
práctica, talentos que compras con dinero real y proyectos que avanzan por
etapas.

Es una aplicación web de un solo archivo. No hay compilación, ni dependencias,
ni servidor: `index.html` lleva dentro el CSS, el JavaScript y la tipografía.
Se puede abrir con doble clic y funciona.

## Cómo se usa

Ábrela en el navegador. Desde el móvil o el escritorio se puede instalar como
aplicación ("Añadir a pantalla de inicio" / "Instalar"), y a partir de ahí
funciona sin conexión.

Al entrar por primera vez hay tres caminos: armar el tablero con tres
preguntas, cargar un ejemplo completo para curiosear, o empezar de cero.

## Dónde viven tus datos

Por defecto, en `localStorage` de tu navegador y en ningún otro sitio. No hay
cuentas, ni analítica, ni nada que salga de tu aparato.

Eso tiene una consecuencia incómoda: el teléfono y la computadora no ven lo
mismo. Para eso está la sincronía opcional.

## Sincronía entre dispositivos (opcional)

Tu progreso se guarda como un archivo JSON dentro de **un repositorio privado
tuyo**. Tú eres el dueño de los datos y del sitio donde están; este proyecto
no tiene servidor al que mandarlos.

### Puesta en marcha

1. Crea un repositorio **privado** y vacío, por ejemplo `notara-datos`.
   No hace falta añadirle nada: la app crea el archivo la primera vez.

2. Genera un *fine-grained personal access token* en
   **Settings → Developer settings → Personal access tokens → Fine-grained tokens**:
   - **Repository access:** solo el repositorio de datos que acabas de crear.
   - **Permissions → Repository permissions → Contents:** `Read and write`.
   - Nada más. Ese token no debe poder tocar ningún otro repositorio.

3. En la app, entra a **Ajustes → Sincronizar entre dispositivos**, escribe tu
   usuario, el nombre del repositorio y el token, y pulsa **Conectar**.

4. Repite el paso 3 en cada aparato. El primero sube lo que ya tenía; los
   demás reciben ese progreso al conectarse.

### Qué esperar

La sincronía ocurre sola al abrir la app, al volver a la pestaña y al
recuperar la conexión. Después de un cambio espera unos segundos antes de
subirlo, para que una tarde de uso sean unos pocos commits y no cien.

Como cada guardado es un commit, el repositorio de datos te queda además como
un historial: puedes ver cómo estabas hace dos semanas.

### Si dos aparatos cambian lo mismo

La app no elige por ti. Te dice qué hay de cada lado y cuándo se guardó, y tú
decides cuál se queda. El lado que no elijas se guarda como copia en el
navegador antes de tocar nada, así que no se pierde.

Esas copias se ven y se recuperan desde **Ajustes → Copias de seguridad
automáticas**, con su fecha y lo que contenía cada una. Se conservan las cinco
más recientes; restaurar una aparta antes lo que tengas ahora, por si te
arrepientes.

### Sobre el token

El token se guarda en `localStorage`, en el navegador de cada dispositivo.
Nunca se escribe dentro del archivo de datos ni se sube a ningún repositorio.

Aun así, conviene saber lo que implica: cualquiera con acceso físico a un
dispositivo desbloqueado podría leerlo desde las herramientas de desarrollo.
Por eso el token debe estar limitado a un único repositorio privado de datos
y a permisos de contenido. Así, en el peor de los casos, lo que está en juego
es ese archivo y nada más. Si pierdes un aparato, revoca el token desde
GitHub: los demás dispositivos solo tendrán que conectarse otra vez.

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
| `index.html` | La aplicación entera: CSS, JavaScript y tipografía incluidos |
| `sw.js` | Service worker; guarda la app para que abra sin conexión |
| `manifest.webmanifest` | Metadatos para poder instalarla |
| `icon.svg` | Icono |

El service worker solo se registra sobre HTTPS, así que abrir el archivo
localmente no activa el modo sin conexión. Es a propósito: evita quedarse con
una versión vieja en caché mientras se trabaja en el código.
