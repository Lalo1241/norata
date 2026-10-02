# Capturas de la app, de día y de noche en una sola imagen

Para las imágenes de una novedad (`novedades/img/`). Eduardo pidió el 2 oct
2026 que la imagen de acompañamiento no repita la del banner: que enseñe la
misma pantalla **partida en diagonal, a 60°, con el día a un lado y la noche al
otro**.

El panel del navegador no saca capturas a 1440×810 exactos, así que esto maneja
un navegador sin ventana por su protocolo.

1. Servir la app: `python -m http.server 8180` desde la raíz.
2. Abrir el navegador sin ventana (Edge o Chrome), con una carpeta de perfil
   corta —con una ruta larga Chrome se sale con el código 21—:

   ```sh
   msedge --headless=new --remote-debugging-port=9333 --user-data-dir=%TEMP%\norata-cdp --window-size=1440,810 --hide-scrollbars about:blank
   ```

3. Las dos capturas, y partirlas:

   ```sh
   node captura.mjs cyber oscuro noche.png
   node captura.mjs cyber claro dia.png
   python partir.py dia.png noche.png ../../novedades/img/0.7.148-cyberpunk-dia-y-noche.jpg
   ```

`captura.mjs <mundo> <oscuro|claro> <salida> [js]` abre la app sin sesión
(`norata-rebotes`), con el ejemplo sembrado y el mundo puesto por
`?apariencia=`, y quita el tutorial y los rótulos de prueba. El cuarto
argumento es JavaScript que corre antes de la foto, para ir a otra pantalla
(`abrirApariencia()`, por ejemplo).

`partir.py` deja el día a la izquierda y la noche a la derecha, y baja la
calidad hasta que el JPG pese menos de 150 KB. **Antes de elegir pantalla, mirar
qué se queda de noche en los dos modos**: la escena de la racha no cambia, así
que si cae del lado del día, ese lado sale oscuro igual.

## Varias apariencias en una sola imagen

Para comparar ambientes o paletas: la misma pantalla en tiras diagonales, cada
una con su rótulo. Las capturas se copian a `_cap/` en la raíz de la app (se
borra al terminar) y `x0` es donde acaba el menú lateral, que no cambia.

```sh
RAIZ=../.. node tiras.mjs salida.png 246 Cobre=cobre.png Zafiro=zafiro.png Duna=duna.png Oliva=oliva.png
```
