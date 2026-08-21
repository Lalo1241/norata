# Versiones de Norata

El número que se ve debajo de Ajustes es el de esta lista. Sirve para dos
cosas: saber si lo que estás viendo ya es lo último que se subió, y poder
nombrar una tanda de trabajo en vez de decir «lo de ayer».

## Cómo se cuenta

| | Qué significa |
| --- | --- |
| **0.x** | Antes de la Play Store. Todo lo de hoy vive aquí. |
| **1.0** | El día del lanzamiento. Lo decide Eduardo, no se llega solo. |

Dentro del `0.x`:

- **La décima** (`0.6` → `0.7`) sube cuando la app **hace algo que antes no
  hacía**, o cambia la forma de usarla: un módulo nuevo, una pantalla nueva,
  algo que cambia cómo se trabaja con ella. La regla para no inflarla: si el
  salto no se puede contar en una frase, no es una décima.
- **El tercer número** (`0.6.1` → `0.6.2`) sube con **cada tanda de trabajo**:
  arreglos, retoques, ajustes. Lo de casi todos los días.

La décima no sube por acumular tandas. Diez arreglos pequeños siguen siendo
arreglos pequeños.

## Al subir la versión

Cuatro sitios, y son cuatro a propósito:

1. `VERSION` en `js/01-base.js`
2. `VERSION_FECHA`, ahí mismo
3. `CACHE` en `sw.js`, con el mismo número — es lo que obliga a los aparatos
   ya instalados a soltar la copia vieja
4. Una línea en esta lista

## La lista

### 0.6.1 · 20 ago 2026
Tanda de ajustes de interfaz.
- El menú de la computadora, más alto y con las esquinas casi rectas.
- La zona de peligro se ve peligrosa: caja roja y botones en coral macizo.
- El mini menú de Ajustes sale arriba del botón, y el botón se queda
  encendido mientras está abierto. Renombradas las tres secciones a
  Mi perfil / Mis módulos / Almacenamiento.
- La página ya no se mueve por detrás de una ventana abierta.
- Sistema de pisos para las ventanas. Arreglado que confirmar saliera por
  debajo de quien lo pedía (Ajustes, la caja del ático, la portada) y que el
  tutorial no se viera al llamarlo desde Ajustes.
- Arreglado que el botón de confirmar un borrado saliera **verde** en vez de
  coral.

### 0.6 · hasta el 20 ago 2026
Donde estaba la app cuando empezó esta cuenta. Los cuatro módulos en pie,
cuentas con Supabase, sincronía entre dispositivos, correos, portada de
entrada y el árbol de talentos con su lienzo. El detalle de cómo se llegó
hasta aquí está en el historial de git.
