# Esta carpeta es una sucursal, no una copia

Es un **worktree de git** de `Proyecto Main Quest`: los mismos datos de git,
otra carpeta y otra rama. Se creó el 28 de agosto de 2026 porque dos sesiones
de Claude trabajando en la MISMA carpeta se llevaban trabajo la una a la otra
dentro de sus commits — tres veces, una en un sentido y dos en el otro. La
causa no eran las ramas: era compartir un solo árbol de trabajo y un solo
índice, así que `commit -a`, `add -A` o `--amend` barrían lo del vecino.

| | |
| --- | --- |
| Carpeta | `Desktop/norata-mapa` |
| Rama | `mapa` |
| Servidor | `python -m http.server 8130` |
| De qué se ocupa | el lienzo, Talentos, Proyectos, el zoom y los controles del mapa |

La carpeta original (`Proyecto Main Quest`) se queda en `main` y con el 8123,
y ahí van los informes, los planes y el panel.

## Cómo se junta con lo demás

Desde la carpeta original, cuando el trabajo del mapa esté listo:

    git merge mapa

Y para deshacer la sucursal el día que sobre:

    git worktree remove ../norata-mapa

## Lo único que hay que recordar

**No hacer `git checkout` de otra rama aquí ni allá para "ver" lo del otro.**
Cada worktree tiene su rama tomada y git lo impide, que es justo la protección
que faltaba. Para mirar lo del otro lado: `git show otra-rama:ruta/archivo`.
