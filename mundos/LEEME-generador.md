# De dónde salen estos archivos

`mundos.css`, `vista.html` y las tablas de `MUNDOS.md` **no se escriben a
mano**: salen de `datos.py`, que es la única descripción de los once mundos.

```sh
python3 construir.py   # regenera la vista
python3 paquete.py     # regenera mundos.css, vista.html y copia los svg
```

Es a propósito. La primera versión de este catálogo tenía los mundos escritos
dos veces —en el borrador y en el documento— y ya empezaban a decir cosas
distintas: un peso aquí, otra escala allá. Con una sola fuente eso no puede
pasar.

Los guiones esperan encontrar los vectores en `svg/` y escriben en esta misma
carpeta. No dependen de nada instalado más que Python 3.
