# Las novedades de Norata

`novedades.json` es lo que cambió en Norata **contado para quien la usa**. Lo
lee la app (la ventana que sale al estrenar una versión y Ajustes → Novedades)
y lo leerá tal cual la página de changelog del sitio el día que exista: por eso
es JSON y no un trozo de JavaScript.

**No es `VERSIONES.md`.** Aquel es el libro de recetas —cada decisión y el
fallo que la motivó—, se escribe para quien toca el código y no se publica.
Esto dice qué ganas tú, en dos o tres renglones.

## Una entrada por cada 3º tramo

```json
{
  "version": "0.7.149",
  "fecha": "2026-09-30",
  "estado": "borrador",
  "titulo": "Lo que llegó, en una frase corta",
  "resumen": "Una o dos frases: qué cambia para ti.",
  "puntos": ["Dos o tres cosas concretas", "…"],
  "retoques": [
    { "version": "0.7.149.1", "texto": "Un renglón por cada 4º.", "en": { "texto": "…" } }
  ],
  "en": { "titulo": "…", "resumen": "…", "puntos": ["…"] }
}
```

- **Un 3º nuevo es una entrada nueva, arriba del todo.** Un 4º es una línea en
  `retoques` de la entrada de su 3º (ver la regla del 4º en `VERSIONES.md`).
- **La fecha va en ISO** (`2026-09-30`) y en hora de México, como todas.
- **`en` es opcional.** Sin ella, en inglés se lee el español: mejor eso que
  nada.
- Lo que no le importa a quien usa la app —un arreglo interno, un
  documento— no lleva entrada ni retoque.

## Nada sale sin que Eduardo lo apruebe

Es suya (0.7.149). Cada entrada nace con `"estado": "borrador"`, y la app solo
enseña las `"publicado"`.

1. **La sesión que publica una versión escribe su entrada o su retoque**, en
   borrador, en el mismo commit que la línea de `VERSIONES.md`.
2. **Eduardo lo revisa en la app** con `?novedades=borrador`: en Ajustes →
   Novedades salen los borradores marcados, y un botón enseña la ventana tal
   como se verá. `?novedades=` lo apaga. Solo vale para esa pestaña.
3. **Al aprobarla** se cambia a `"publicado"` —a mano en GitHub o pidiéndoselo
   a una sesión—. Como este archivo está en `ASSETS`, el cambio llega a los
   dispositivos con la siguiente versión que se publique. Si corre prisa, se
   publica solo eso como un 4º de la versión vigente.

La ventana se apunta como vista POR ENTRADA, no por número de versión: una
entrada aprobada días después de que su versión llegó sale igual la próxima vez
que se abra la app.

## Cómo se escribe

Las reglas de «El tono» de `CLAUDE.md`, y además:

- **Qué ganas tú, no cómo se hizo.** «Cambiar de mundo ya no parpadea», no
  «la hoja de los mundos se engancha antes del primer pintado».
- **Tuteo, español de México, sin exclamaciones** y sin mayúsculas para
  gritar.
- **Corto.** El título en una línea; los puntos, uno por renglón en el
  teléfono.
