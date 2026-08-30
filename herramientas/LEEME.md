# La red de debajo

Dos guiones para comprobar que un cambio de estilos **no movió nada**. No son
parte de la app: no se sirven, no están en `ASSETS` de `sw.js` y el navegador
no los ve nunca. La app sigue sin compilación; esto es herramienta de taller.

Existen porque el panel del navegador no compone imagen en algunos entornos y
las capturas fallan (ver `CLAUDE.md`), así que la verificación se hace midiendo
el DOM. A mano eso no se sostiene: son veinticuatro mil elementos.

## Cómo se usa

```sh
python3 -m http.server 8123           # la app tiene que ir por HTTP
npm install playwright                 # fuera del repositorio, donde sea

node foto.js antes.json                # con el código SIN tocar
#   ... aquí se hace el cambio ...
node foto.js despues.json
node diff.js antes.json despues.json
```

`foto.js` abre siete pantallas en los dos modos con el ejemplo completo
sembrado (`verElEjemplo()`) y anota los estilos calculados de cada elemento más
su rectángulo. `diff.js` los compara y dice qué se movió y dónde.

## Las dos trampas que ya están resueltas dentro

1. **Sin componer fotogramas las transiciones no terminan nunca** y
   `getComputedStyle` devuelve el valor de PARTIDA. Se saltan al final antes de
   medir. Las que no acaban nunca —un pulso que late— no se pueden «terminar»:
   se paran en el cuadro cero, o su valor cambia entre una foto y la siguiente
   y el diff se llena de ruido que no es un cambio.
2. **Hay que entrar sin cuenta** o la portada tapa la app. Se hace poniendo
   `entrada: "local"` en `mainquest-sync-v1` antes de que cargue la página.

## Cómo saber si la red funciona

Antes de fiarse de un «no cambió nada», dos comprobaciones:

- **Dos fotos de la app sin tocar tienen que salir idénticas.** Si no, hay
  ruido y el diff no vale.
- **Un cambio de un píxel tiene que verse.** Mover una esquina de `18px` a
  `17px` en `.ms-card` salta 106 veces. Si no salta, lo que está roto es la
  prueba.

## Medir cuánto tarda en abrirse

`servidor-lento.py` es un GitHub Pages de mentira: comprime como el de verdad,
pone las mismas cabeceras de caché, va tan lento como se le diga y **apunta cada
petición en una bitácora**. Sin esas cuatro cosas la medición engaña.

```sh
openssl req -x509 -newkey rsa:2048 -keyout llave.pem -out cert.pem \
  -days 2 -nodes -subj "/CN=127.0.0.1" -addext "subjectAltName=IP:127.0.0.1"
python3 servidor-lento.py 8152 1200 0.18     # puerto, kbps, latencia en segundos
```

Las tres trampas que hacen que una medición de carga salga falsa, y que este
servidor resuelve:

1. **Con TLS, no sin él.** El service worker solo se registra en `https:` (ver
   `js/11-arranque.js`), así que midiendo por `http://` nunca se toca su camino
   y las visitas repetidas salen falsamente rápidas.
2. **La lentitud va en el SERVIDOR, no en el panel del navegador.** El service
   worker pide por su cuenta y la simulación de red del panel no le alcanza.
3. **Comprimido.** Sin gzip la app «pesa» 1,35 MB en vez de 460 KB y todos los
   números salen al triple.

Y una cuarta que no es del servidor: **el ancho de banda es uno y se reparte**.
Con un límite por hilo, seis descargas en paralelo van a seis veces la
velocidad; la primera versión de esto medía tres veces más rápido de lo real.

La verdad de cuántas veces se pidió cada cosa está en `bitacora-<puerto>.txt`,
no en el navegador: una respuesta que sirve el service worker se anota con
`transferSize` 0 aunque por debajo haya ido a la red.

## Y el contraste de un mundo

`contraste.js` mide los mundos de `mundos/vista.html`: fotografía la superficie
—que sí tiene fondo— y saca de ahí el color más repetido, con degradado y
textura incluidos; la tinta sale del CSS, compuesta si es semitransparente.

```sh
node contraste.js ../mundos/vista.html
```

Se llegó ahí después de equivocarse tres veces, y las tres están anotadas en
la cabecera del archivo para que nadie las repita: leer `backgroundColor` tal
cual reprueba lo semitransparente, componer sin leer degradados reprueba lo
degradado, y fotografiar el TEXTO reprueba todo porque una captura de elemento
viene sobre transparente.
