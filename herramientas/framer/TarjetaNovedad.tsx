// Copia versionada del componente de código «TarjetaNovedad» del proyecto de
// Framer (norata.framer.website). Aquí NO corre: vive en Framer, en Assets →
// Code. Si se cambia, se vuelve a pegar allá.
//
// Es la tarjeta ENTERA de una novedad en /changelog, y es código y no capas por
// tres cosas que Eduardo pidió (2 oct 2026) y que con capas no salen:
//   - las imágenes van ENTRE el texto, no todas al final: el cuerpo llega como
//     HTML ya armado (`cuerpo()` en herramientas/novedades-framer.py) y un
//     texto con formato de Framer no deja darles tamaño ni abrirlas;
//   - todas las imágenes de una tarjeta miden lo mismo, y se abren al tocarlas;
//   - la cápsula cambia de color según la clase.
// El banner va pegado a los cantos de la tarjeta, ancho como el de un parche de
// Steam. Los tonos son los de la cara clara del sitio.
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { addPropertyControls, ControlType } from "framer"

const TONOS = {
    expansion: ["#007046", "rgba(0, 112, 70, 0.09)"],
    mejora: ["#0F688F", "rgba(15, 104, 143, 0.10)"],
    arreglo: ["#3D4052", "#E9ECF7"],
    etapa: ["#5B3BB5", "rgba(125, 80, 234, 0.10)"],
}

// Por lo que DICE la clase y no por igualdad exacta: así vale para el español,
// para el inglés (Expansion, Improvement, Fix, New stage) y sin acentos.
function tonoDe(clase) {
    const c = String(clase || "").toLowerCase()
    if (c.includes("etapa") || c.includes("stage")) return TONOS.etapa
    if (c.includes("expansi")) return TONOS.expansion
    if (c.includes("arreglo") || c.includes("fix")) return TONOS.arreglo
    return TONOS.mejora
}

// En UTC a propósito: la fecha llega como medianoche UTC, y con el huso de
// quien mira «30 sep» saldría «29 sep» en todo México.
function fechaCorta(fecha, idioma) {
    const d = new Date(fecha)
    if (!fecha || isNaN(d.getTime())) return ""
    return new Intl.DateTimeFormat(idioma === "en" ? "en-US" : "es-MX", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    }).format(d)
}

const CSS = `
.nv-tarjeta { container-type: inline-size; width: 100%; box-sizing: border-box; overflow: hidden;
  background: #F3F3FE; border-radius: 20px; color: #10151D;
  box-shadow: inset 0 1px 0 #FFFFFF, inset 0 -3px 0 #DFDEFB, 0 10px 24px rgba(26, 0, 108, 0.06);
  font-family: "Poppins", system-ui, -apple-system, "Segoe UI", sans-serif; font-size: 16px; line-height: 1.55; text-align: left; }
.nv-tarjeta *, .nv-tarjeta *::before { box-sizing: border-box; }
.nv-banner { display: block; width: 100%; aspect-ratio: 4 / 1; min-height: 150px; max-height: 260px; object-fit: cover; background: #10151D; }
.nv-cuerpo { padding: 26px 30px 30px; display: grid; gap: 10px; min-width: 0; }
.nv-cab { display: flex; align-items: center; gap: 6px 10px; flex-wrap: wrap; }
.nv-clase { font-size: 11px; font-weight: 600; line-height: 18px; letter-spacing: 0.08em; text-transform: uppercase; white-space: nowrap; border-radius: 999px; padding: 3px 10px; }
.nv-ver { font-size: 13px; font-weight: 500; color: #3D4052; font-variant-numeric: tabular-nums; }
.nv-fecha { font-size: 13px; color: #636A7C; }
.nv-titulo { margin: 2px 0 0; font-size: 22px; line-height: 1.25; font-weight: 600; letter-spacing: -0.03em; text-wrap: balance; }
.nv-resumen { margin: 0; color: #3D4052; max-width: 68ch; text-wrap: pretty; }
.nv-html { display: grid; gap: 14px; min-width: 0; }
.nv-html:empty { display: none; }
.nv-puntos { margin: 0; padding-left: 20px; display: grid; gap: 6px; max-width: 68ch; }
.nv-puntos li::marker { color: #007046; }
/* Siempre dos columnas en ancho, así una imagen sola mide lo mismo que cada
   una de un par: en una tarjeta todas las imágenes son la misma caja. */
.nv-medios { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin: 4px 0; }
.nv-fig { margin: 0; aspect-ratio: 16 / 9; border-radius: 12px; overflow: hidden; background: #10151D; }
.nv-fig img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: center top; cursor: zoom-in; transition: transform 0.25s ease; }
.nv-fig.nv-grafico img { object-fit: contain; object-position: center; }
.nv-fig img:hover { transform: scale(1.02); }
.nv-fig img:focus-visible { outline: 3px solid #00915A; outline-offset: -3px; }
.nv-rotulo { margin: 8px 0 -4px; padding-top: 18px; border-top: 1px solid #CCD1E4; font-size: 11px; line-height: 1.4; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #636A7C; }
.nv-retoques { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.nv-retoques li { display: grid; grid-template-columns: 82px minmax(0, 1fr); gap: 12px; align-items: start; font-size: 14.5px; line-height: 1.5; color: #3D4052; }
.nv-retoques strong { justify-self: start; font-size: 12px; line-height: 18px; font-weight: 600; font-variant-numeric: tabular-nums; color: #3D4052; background: #E9ECF7; border-radius: 6px; padding: 2px 7px; }
@container (max-width: 540px) {
  .nv-cuerpo { padding: 20px 18px 22px; }
  .nv-titulo { font-size: 20px; }
  .nv-medios { grid-template-columns: minmax(0, 1fr); }
  .nv-retoques li { grid-template-columns: minmax(0, 1fr); gap: 4px; }
}
@media (prefers-reduced-motion: reduce) { .nv-fig img { transition: none; } .nv-fig img:hover { transform: none; } }
.nv-zoom { position: fixed; inset: 0; z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 4vmin; background: rgba(16, 21, 29, 0.88); cursor: zoom-out; }
.nv-zoom img { max-width: 100%; max-height: 100%; border-radius: 10px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); }
.nv-zoom button { position: absolute; top: 14px; right: 14px; width: 44px; height: 44px; border: 0; border-radius: 50%; background: rgba(255, 255, 255, 0.14); color: #FFFFFF; font: 400 26px/1 system-ui, sans-serif; cursor: pointer; }
.nv-zoom button:focus-visible { outline: 3px solid #FFFFFF; outline-offset: 2px; }
`

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function TarjetaNovedad(props) {
    const { clase, version, fecha, titulo, resumen, cuerpo, banner, bannerAlt, foco, idioma } = props
    const [tinta, fondo] = tonoDe(clase)
    const [abierta, setAbierta] = useState(null)
    const caja = useRef(null)
    const en = idioma === "en"

    // El cuerpo llega como HTML: sus imágenes no son botones hasta que se les
    // dice, y sin esto no se abrirían con el teclado.
    useEffect(() => {
        if (!caja.current) return
        caja.current.querySelectorAll(".nv-fig img").forEach((img) => {
            img.setAttribute("tabindex", "0")
            img.setAttribute("role", "button")
            img.setAttribute("title", en ? "Open larger" : "Ver más grande")
        })
    }, [cuerpo, en])

    useEffect(() => {
        if (!abierta) return
        const tecla = (e) => e.key === "Escape" && setAbierta(null)
        const antes = document.body.style.overflow
        document.body.style.overflow = "hidden"
        window.addEventListener("keydown", tecla)
        return () => {
            document.body.style.overflow = antes
            window.removeEventListener("keydown", tecla)
        }
    }, [abierta])

    const abrir = (e) => {
        const img = e.target
        if (!img || img.tagName !== "IMG" || !img.closest(".nv-fig")) return
        if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return
        e.preventDefault()
        setAbierta({ src: img.currentSrc || img.src, alt: img.alt })
    }

    return (
        <article className="nv-tarjeta" style={props.style}>
            <style>{CSS}</style>
            {banner && banner.src ? (
                <img
                    className="nv-banner"
                    src={banner.src}
                    srcSet={banner.srcSet}
                    sizes="(min-width: 900px) 860px, 100vw"
                    alt={bannerAlt || banner.alt || ""}
                    style={{ objectPosition: foco || "50% 50%" }}
                />
            ) : null}
            <div className="nv-cuerpo">
                <div className="nv-cab">
                    <span className="nv-clase" style={{ color: tinta, background: fondo }}>
                        {clase}
                    </span>
                    {version ? <span className="nv-ver">V{version}</span> : null}
                    {fecha ? <time className="nv-fecha">{fechaCorta(fecha, idioma)}</time> : null}
                </div>
                <h3 className="nv-titulo">{titulo}</h3>
                {resumen ? <p className="nv-resumen">{resumen}</p> : null}
                <div
                    className="nv-html"
                    ref={caja}
                    onClick={abrir}
                    onKeyDown={abrir}
                    dangerouslySetInnerHTML={{ __html: cuerpo || "" }}
                />
            </div>
            {abierta && typeof document !== "undefined"
                ? createPortal(
                      <div className="nv-zoom" role="dialog" aria-modal="true" onClick={() => setAbierta(null)}>
                          <style>{CSS}</style>
                          <img src={abierta.src} alt={abierta.alt} />
                          <button type="button" autoFocus aria-label={en ? "Close" : "Cerrar"}>
                              ×
                          </button>
                      </div>,
                      document.body
                  )
                : null}
        </article>
    )
}

addPropertyControls(TarjetaNovedad, {
    clase: { title: "Clase", type: ControlType.String, defaultValue: "Expansión" },
    version: { title: "Versión", type: ControlType.String, defaultValue: "0.7.148" },
    fecha: { title: "Fecha", type: ControlType.Date },
    titulo: { title: "Título", type: ControlType.String, defaultValue: "Cyberpunk, el quinto mundo" },
    resumen: { title: "Resumen", type: ControlType.String, displayTextArea: true, defaultValue: "Lo que cambia para ti, en una o dos frases." },
    cuerpo: { title: "Cuerpo", type: ControlType.String, displayTextArea: true, defaultValue: '<ul class="nv-puntos"><li>Un punto</li><li>Otro punto</li></ul>' },
    banner: { title: "Banner", type: ControlType.ResponsiveImage },
    bannerAlt: { title: "Banner alt", type: ControlType.String, defaultValue: "" },
    foco: { title: "Banner foco", type: ControlType.String, defaultValue: "50% 50%" },
    idioma: { title: "Idioma", type: ControlType.Enum, options: ["es", "en"], optionTitles: ["Español", "English"], defaultValue: "es" },
})
