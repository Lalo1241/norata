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
npm install playwright pngjs           # fuera del repositorio, donde sea

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
Ocho medidas por mundo: título, secundario, cifra, aro, barra y los tres chips.

```sh
node contraste.js ../mundos/vista.html
```

Se llegó ahí después de equivocarse CUATRO veces, y las cuatro están anotadas
en la cabecera del archivo para que nadie las repita: leer `backgroundColor`
tal cual reprueba lo semitransparente, componer sin leer degradados reprueba lo
degradado, fotografiar el TEXTO reprueba todo porque una captura de elemento
viene sobre transparente, y leer la tinta con una expresión que solo entiende
`rgb()` reprueba todo otra vez en cuanto aparece un `color-mix()`, que se
serializa como `color(srgb 0.39 1 0.70)` —canales de 0 a 1, no de 0 a 255—.

**Los chips se añadieron tarde y por eso hacían falta.** Van sobre su propio
velo y no sobre la tarjeta, así que ninguna de las otras medidas los tocaba: al
mirarlos por primera vez, nueve chips de cinco mundos estaban por debajo de
4,5. Lo que no se mide no está bien; solo no se sabe.

**Cómo distinguir un fallo del arnés de un fallo del mundo:** el número sale
imposible *en la dirección contraria* al cambio. Si un arreglo empuja la tinta
hacia el color legible y la medida EMPEORA, la rota es la medida.

## Dónde está de verdad un adorno

`donde.js` responde a "este dibujo no está donde lo puse". Fotografía la
tarjeta con el adorno y sin él, resta las dos imágenes y dice en qué
porcentaje del ancho cae lo que cambió.

```sh
node donde.js                 # sobre mundos/vista.html
```

Dos cosas que aprendió a la mala: hay que **congelar las animaciones** antes
de las dos fotos —si no, la barra de avance se mueve entre una y otra y el
diff la señala a ella—, y hay que apagar **solo el pseudoelemento**, no el
fondo de la tarjeta, o cambia todo y el resultado no dice nada.

## Cuánto pesa el fondo de un mundo

`campo.js` contesta lo que a ojo se contesta mal: si el fondo susurra o compite.
Fotografía el lienzo, saca el color de la página y da el contraste del resto
contra él en el percentil 90.

```sh
node campo.js /ruta/mundos/vista.html
```

Por debajo de **~1,6** el fondo acompaña; por encima de **~2** pelea con lo que
hay que leer. Sirvió para poner número a algo que se había dicho a ojo: el campo
de flores de Talavera daba 2,70 cuando ningún otro mundo pasaba de 1,53.

## ¿Casa un mosaico consigo mismo?

`costura.js` pinta el motivo dos veces seguidas y compara la columna del borde
con la del mosaico siguiente, y la fila de abajo con la de más abajo. **Cero es
que casa.**

```sh
node costura.js /ruta/mundos/svg/arboleda-dosel.svg 170
```

De paso da la densidad de tinta y su reparto por cuadrantes, que es como se ve
si el motivo está vacío o si se apelmaza en una esquina.

**Y la forma de que casen siempre:** dibujar el motivo una vez en un `<g>` y
repetirlo con `<use>` en las nueve posiciones vecinas (0 y ±lado en las dos
direcciones). Lo que sale por un lado entra por el otro por construcción. Contar
a mano qué figura cruza qué borde es lo que dejó el escalón de Papel picado.

## ¿Hay dibujo debajo de lo que hay que leer?

La medida que faltaba, y encontró dos mundos rotos que ninguna otra veía.
`debajo.js` oculta **sólo** un elemento —con `visibility`, que no mueve nada—,
fotografía su rectángulo exacto y mira el reparto de lo que hay detrás.

```sh
node debajo.js /ruta/mundos/vista.html
```

Una superficie lisa da **1,0**; un dibujo da **1,5 y más**. El límite es
**1,35**. La tarjeta protege lo que lleva dentro, pero el XP, los títulos de
sección y los chips se apoyan directamente en la página y ahí es donde se rompe.

`bandas.js` completa la foto: perfil de tinta por franjas horizontales del
lienzo, con el contenido oculto. Dice **a qué altura** está el dibujo, que es lo
que separa una composición —cenefa arriba, campo liso— de un estampado.

```sh
node bandas.js /ruta/mundos/vista.html m-talavera
```

**Y por qué hacen falta las tres.** `campo.js` mide todo el lienzo y a un mundo
compuesto le sale alto por la cenefa; `debajo.js` mira sólo bajo el texto;
`bandas.js` dice dónde está cada cosa. Talavera da 2,58 en campo y 1,25 en
debajo, y las dos cifras son correctas.
