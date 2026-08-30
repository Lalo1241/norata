# -*- coding: utf-8 -*-
"""Emite el borrador (artifact) y el paquete que se lleva al repositorio.
Los dos salen de datos.py, así que no pueden contradecirse."""
import datos, html, os

M, FAM = datos.MUNDOS, datos.FAMILIAS

FUENTES = ("Outfit:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600"
 "&family=Alegreya+Sans:wght@700;800&family=Baloo+2:wght@600;700"
 "&family=Big+Shoulders+Display:wght@700&family=Chakra+Petch:wght@600;700&family=Cinzel:wght@700"
 "&family=Grenze+Gotisch:wght@600;700&family=JetBrains+Mono:wght@700&family=Julius+Sans+One"
 "&family=Michroma&family=Patrick+Hand&family=Rajdhani:wght@600;700&family=Sora:wght@600;700"
 # solo para la pista de pruebas, no las usa ningún mundo
 "&family=Bevan&family=Bungee&family=Monoton&family=Poppins:wght@700")

def bloque_css(m):
    cuerpo = "\n".join(f"  {k}: {v};" for k, v in m["tokens"].items())
    extra = ("\n" + m["extra"]) if m.get("extra") else ""
    return f".{m['id']} {{\n{cuerpo}\n}}{extra}"

MOCK = """<div class="lienzo">
  <div class="ficha"><span class="aro"></span><span class="ic"></span>
    <div class="med"><span class="nombre">Correr 5 km</span><span class="barra"><i></i></span><span class="pie">Resistencia · nivel 4</span></div></div>
  <div class="tira"><span class="chip c-ok">Hecho</span><span class="chip c-av">Vence hoy</span><span class="chip c-no">Perdida</span></div>
  <div class="cifra">1 840<span>XP</span></div>
</div>"""

def ficha_html(m):
    e = html.escape
    return f"""<article class="mundo {m['id']}" id="m-{m['id']}">
  <div class="mundo-cab">
    <div class="txt"><h3>{e(m['nombre'])}</h3><span class="premisa">{e(m['premisa'])}</span></div>
    <span class="llave" style="color:{m['color']};">{e(m['llave'])}</span>
  </div>
  <div class="cuerpo">
    {MOCK}
    <div class="datos">
      <dl class="hechos">
        <div class="hecho"><dt>Letra</dt><dd><b>{e(m['letra'])}</b> · {e(m['ancho'])} de ancho{'' if m['escala']=='1' else f" · escala <b>{m['escala']}</b>"}</dd></div>
        <div class="hecho"><dt>Esquinas</dt><dd>{e(m['esquinas'])}</dd></div>
        <div class="hecho"><dt>Peso</dt><dd><b>{e(m['peso'])}</b></dd></div>
        <div class="hecho"><dt>Horas</dt><dd><b>{e(m['horas'])}</b></dd></div>
      </dl>{('<p class="apunte">' + e(m['nota']) + '</p>') if m.get('nota') else ''}
    </div>
  </div>
</article>"""

CARAS_PISTA = [
 ("Big Shoulders Display","VENTISCA","−26%","174,2","sobran 92","pasa","'Big Shoulders Display',Impact","30px","700"),
 ("Alegreya Sans","TALAVERA","−14%","204,2","sobran 62","pasa","'Alegreya Sans',system-ui","30px","800"),
 ("Grenze Gotisch","AVERNO","−17%","195,3","sobran 71","pasa","'Grenze Gotisch',Georgia,serif","30px","700"),
 ("Patrick Hand","POST-IT","−22%","185,6","sobran 80","pasa","'Patrick Hand',cursive","30px","400"),
 ("Rajdhani","BLUEPRINT","−10%","212,5","sobran 54","pasa","'Rajdhani',system-ui","30px","700"),
 ("Outfit","GRABADO · LA DE CASA","+0%","236,5","sobran 30","pasa","'Outfit',sans-serif","30px","700"),
 ("Chakra Petch","CYBERPUNK","+4%","245,4","sobran 21","pasa","'Chakra Petch',system-ui","30px","700"),
 ("Sora","OBSIDIANA","+13%","268,1","se pasa 2","falla","'Sora',system-ui","30px","600"),
 ("Sora","CON SU ESCALA · 0.99","","265,3","entra","pasa","'Sora',system-ui","29.7px","600"),
 ("Poppins","LA QUE PROPUSISTE","+11%","263,0","justo, 3","justo","'Poppins',sans-serif","30px","700"),
 ("Julius Sans One","CÉNIT","+23%","290,9","se pasa 25","falla","'Julius Sans One',system-ui","30px","400"),
 ("Julius Sans One","CON SU ESCALA · 0.91","","264,7","entra","pasa","'Julius Sans One',system-ui","27.3px","400"),
 ("Michroma","BASTIÓN","+38%","326,8","se pasa 61","falla","'Michroma',system-ui","30px","400"),
 ("Michroma","CON SU ESCALA · 0.81","","264,7","entra","pasa","'Michroma',system-ui","24.3px","400"),
 ("Cinzel","FORJA · con 0.88","+28%","265,5","entra","pasa","'Cinzel',Georgia,serif","26.4px","700"),
 ("JetBrains Mono","CONSOLA · con 0.86","+29%","263,1","entra","pasa","'JetBrains Mono',monospace","25.8px","700"),
 ("Bungee","DESCARTADA · ilegible","+39%","328,4","se pasa 62","falla","'Bungee',Impact","30px","400"),
 ("Monoton","DESCARTADA · +42%","+42%","335,5","se pasa 70","falla","'Monoton',cursive","30px","400"),
]

def pista_html():
    filas = []
    for cara, ctx, anc, w, ver, cls, ff, px, pw in CARAS_PISTA:
        esc = " escalada" if "ESCALA" in ctx else ""
        filas.append(f"""<div class="carril{esc}">
      <div class="quien"><b>{html.escape(cara)}</b><span>{html.escape(ctx)}{' · '+anc if anc else ''}</span></div>
      <div class="medida"><div class="caja"><div class="txt" style="font-family:{ff};font-size:{px};font-weight:{pw}">Árbol de talentos</div></div></div>
      <div class="veredicto {cls}">{w} px<br>{ver}</div></div>""")
    return "\n".join(filas)

def tabla_html():
    fil = "\n".join(
      f"<tr><td><b>{html.escape(m['nombre'])}</b></td><td>{html.escape(m['llave'])}</td>"
      f"<td>{html.escape(m['letra'])}</td><td class='num'>{html.escape(m['ancho'])}</td>"
      f"<td class='num'>{m['escala']}</td><td>{html.escape(m['esquinas'])}</td>"
      f"<td class='num'>{html.escape(m['peso'])}</td><td>{html.escape(m['horas'])}</td></tr>" for m in M)
    return ("<div class='tabla-caja'><table><thead><tr><th>Mundo</th><th>Qué es</th><th>Letra</th>"
            "<th>Ancho</th><th>Escala</th><th>Esquinas</th><th>Peso</th><th>Horas</th></tr></thead>"
            f"<tbody>{fil}</tbody></table></div>")

ESQ = [("0 px","Grabado · Consola · Obsidiana · Forja · Blueprint · Cyberpunk","0"),
       ("3 px","Cénit · Ventisca","3px"),
       ("4 px","Bastión","4px"),
       ("2 px","Averno · Post-it","2px"),("14 px","Talavera","14px"),
       ("Del todo","Neón","999px")]

def esquinas_html():
    return "\n".join(
      f"<div class='esq'><div class='cuadro' style='border-radius:{r}'></div><b>{n}</b><span>{t}</span></div>"
      for t, n, r in ESQ)

# ---------------------------------------------------------------- estilos
CHROME = """
:root{
  color-scheme: light dark;
  --fondo:#e6e8f0; --fondo-2:#dcdef0; --sup:#f3f2f9;
  --hilo:rgba(22,32,43,.13); --hilo-fuerte:rgba(22,32,43,.26);
  --tinta:#161f2b; --tinta-2:#4d5a67; --tinta-3:#7a8792;
  --menta:#007046; --menta-viva:#00cc7f; --coral:#bd2200; --ambar:#755c05;
  --sans:"Outfit",-apple-system,"Segoe UI",system-ui,sans-serif;
  --mono:"IBM Plex Mono",ui-monospace,monospace;
}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){
  --fondo:#0f1319; --fondo-2:#0b0f14; --sup:#171d26;
  --hilo:rgba(230,238,240,.11); --hilo-fuerte:rgba(230,238,240,.24);
  --tinta:#e6eef0; --tinta-2:#96a3ad; --tinta-3:#64717c;
  --menta:#5fe0b0; --menta-viva:#5fe0b0; --coral:#ff8a70; --ambar:#f5d76e; } }
:root[data-theme="dark"]{
  --fondo:#0f1319; --fondo-2:#0b0f14; --sup:#171d26;
  --hilo:rgba(230,238,240,.11); --hilo-fuerte:rgba(230,238,240,.24);
  --tinta:#e6eef0; --tinta-2:#96a3ad; --tinta-3:#64717c;
  --menta:#5fe0b0; --menta-viva:#5fe0b0; --coral:#ff8a70; --ambar:#f5d76e; }

*{ box-sizing:border-box; }
body{ margin:0; background:var(--fondo); color:var(--tinta); font-family:var(--sans); font-size:17px; line-height:1.6; -webkit-font-smoothing:antialiased; }
.hoja{ max-width:1080px; margin:0 auto; padding:0 22px 120px; }
h1{ font-size:clamp(2.4rem,6.5vw,3.9rem); font-weight:700; line-height:1.03; letter-spacing:-.033em; margin:0; text-wrap:balance; }
h2{ font-size:clamp(1.45rem,3vw,1.95rem); font-weight:600; line-height:1.15; letter-spacing:-.02em; margin:0; text-wrap:balance; }
h3{ font-size:1.1rem; font-weight:600; margin:0; line-height:1.3; letter-spacing:-.01em; }
p{ margin:0; max-width:66ch; }
code{ font-family:var(--mono); font-size:.86em; }
strong{ font-weight:600; color:var(--tinta); }
.rotulo{ font-family:var(--mono); font-size:.68rem; font-weight:500; letter-spacing:.2em; text-transform:uppercase; color:var(--tinta-3); }
.entradilla{ font-size:1.18rem; font-weight:300; color:var(--tinta-2); max-width:58ch; }
header{ padding:76px 0 8px; display:flex; flex-direction:column; gap:18px; }
.serie{ display:flex; align-items:center; gap:10px; }
.serie i{ width:22px; height:22px; border-radius:7px; flex:none; background:linear-gradient(150deg,var(--menta-viva),color-mix(in srgb,var(--menta-viva),#000 35%)); }
.tesis{ border-left:2px solid var(--menta-viva); padding:3px 0 3px 20px; max-width:56ch; font-size:1.22rem; font-weight:300; line-height:1.5; color:var(--tinta); }
.tesis b{ font-weight:600; }
section{ padding-top:62px; }
.cabeza{ display:flex; flex-direction:column; gap:11px; margin-bottom:26px; }
.raya{ height:1px; background:var(--hilo); margin-top:4px; }
.nota{ font-size:.88rem; color:var(--tinta-3); line-height:1.55; max-width:66ch; }
.reglas{ display:grid; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); gap:13px; }
.regla{ background:var(--sup); border:1px solid var(--hilo); border-radius:13px; padding:17px 18px 19px; display:flex; flex-direction:column; gap:7px; }
.regla h3{ font-size:1rem; } .regla p{ font-size:.92rem; color:var(--tinta-2); line-height:1.5; }
.banco{ background:var(--sup); border:1px solid var(--hilo); border-radius:14px; padding:18px 20px 20px; display:flex; flex-direction:column; gap:6px; margin-bottom:22px; }
.banco .cifrota{ font-size:2.1rem; font-weight:700; letter-spacing:-.03em; line-height:1.1; font-variant-numeric:tabular-nums; }
.banco p{ font-size:.93rem; color:var(--tinta-2); }
.pista{ display:flex; flex-direction:column; border:1px solid var(--hilo); border-radius:13px; overflow:hidden; }
.carril-cab,.carril{ display:grid; grid-template-columns:150px 1fr 96px; gap:12px; align-items:center; padding:11px 14px; }
.carril-cab{ background:var(--fondo-2); font-family:var(--mono); font-size:.62rem; letter-spacing:.13em; text-transform:uppercase; color:var(--tinta-3); padding:9px 14px; }
.carril{ border-top:1px solid var(--hilo); }
.carril .quien{ display:flex; flex-direction:column; gap:1px; min-width:0; }
.carril .quien b{ font-size:.9rem; font-weight:600; }
.carril .quien span{ font-family:var(--mono); font-size:.6rem; color:var(--tinta-3); letter-spacing:.06em; }
.medida{ position:relative; overflow:hidden; }
.medida .caja{ position:relative; width:266px; max-width:100%; border-right:2px solid var(--coral); }
.medida .txt{ white-space:nowrap; line-height:1.25; color:var(--tinta); }
.veredicto{ font-family:var(--mono); font-size:.64rem; letter-spacing:.05em; text-align:right; }
.pasa{ color:var(--menta); } .justo{ color:var(--ambar); } .falla{ color:var(--coral); }
.carril.escalada{ background:color-mix(in srgb,var(--menta-viva) 6%, transparent); }
@media (max-width:720px){ .carril-cab,.carril{ grid-template-columns:1fr; gap:6px; } .veredicto{ text-align:left; } .medida{ overflow-x:auto; } }
.familia{ margin-top:46px; }
.familia-cab{ display:flex; align-items:baseline; gap:14px; flex-wrap:wrap; padding-bottom:4px; }
.familia-cab .n{ font-family:var(--mono); font-size:1.4rem; font-weight:600; color:var(--hilo-fuerte); line-height:1; }
.familia-cab .d{ color:var(--tinta-2); font-size:.94rem; max-width:56ch; }
.mundo{ border:1px solid var(--hilo); border-radius:16px; overflow:hidden; background:var(--sup); margin-top:18px; }
.mundo-cab{ display:flex; align-items:flex-start; justify-content:space-between; gap:18px; flex-wrap:wrap; padding:19px 21px 17px; }
.mundo-cab .txt{ display:flex; flex-direction:column; gap:5px; }
.mundo-cab h3{ font-size:1.22rem; }
.mundo-cab .premisa{ font-size:.96rem; color:var(--tinta-2); max-width:58ch; line-height:1.5; }
.llave{ font-family:var(--mono); font-size:.63rem; letter-spacing:.13em; text-transform:uppercase; padding:5px 11px; border-radius:99px; white-space:nowrap; flex:none; border:1px solid currentColor; margin-top:3px; }
.cuerpo{ display:grid; grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr); border-top:1px solid var(--hilo); }
@media (max-width:780px){ .cuerpo{ grid-template-columns:1fr; } }
.lienzo{ background:var(--m-pagina); padding:26px 24px 28px; display:flex; flex-direction:column; gap:15px; position:relative; isolation:isolate; }
.lienzo::after{ content:""; position:absolute; inset:0; z-index:-1; background:var(--m-grano,none); opacity:var(--m-grano-op,0); pointer-events:none; }
.ficha{ background:var(--m-tarjeta); border:var(--m-borde) solid var(--m-borde-color); border-image:var(--m-marco,none); border-radius:var(--m-r-tarjeta); box-shadow:var(--m-sombra,none); padding:14px 15px; display:flex; align-items:center; gap:12px; position:relative; margin-bottom:var(--m-fleco-alto,0); }
.ficha::before{ content:""; position:absolute; left:0; right:0; top:0; height:var(--m-cenefa-alto,0); background:var(--m-cenefa,none); pointer-events:none; }
/* `::after` queda LIBRE para el adorno de cada mundo, y esto no es un detalle:
   aquí vivía una regla global de fleco con `left:0; right:0`, y los adornos
   que declaran solo `right` heredaban ese `left:0`. Un elemento absoluto con
   `left`, `right` Y `width` a la vez está sobredeterminado, y el navegador
   descarta el `right`: los anillos de Averno y la voluta de Forja se pegaban
   a la IZQUIERDA por eso, no por estar mal medidos. Costó tres rondas.
   El fleco se lo lleva ahora el mundo que lo usa, en su propio bloque. */
/* Al pasar el cursor, cada mundo se mueve a SU velocidad y con SU curva.
   Por defecto la ficha se levanta; el que declare `--m-empuje` hace lo
   contrario —se apoya y cierra su sombra—, que es el gesto de bajar una
   plancha sobre el papel. Un solo par de reglas para los catorce. */
.ficha{ transform:rotate(var(--m-giro,0deg)); transition:transform var(--m-dur,.4s) var(--m-curva,ease), box-shadow var(--m-dur,.4s) var(--m-curva,ease); }
/* El giro va también en el hover: sin repetirlo, la nota se endereza sola al
   pasar el cursor, que es lo contrario de lo que hace un papel pegado. */
.mundo:hover .ficha{ transform:translate(var(--m-empuje,0px), var(--m-empuje,-3px)) rotate(var(--m-giro,0deg)); box-shadow:var(--m-sombra-encima, var(--m-sombra,none)); }
@media (prefers-reduced-motion:reduce){ .ficha{ transition:none; } .mundo:hover .ficha{ transform:rotate(var(--m-giro,0deg)); } }
.aro{ width:38px; height:38px; border-radius:999px; flex:none; border:2px solid var(--m-acento); background:transparent; box-shadow:var(--m-halo,none); }
.ic{ width:28px; height:28px; flex:none; border-radius:var(--m-r-mini); background:var(--m-icono); }
.ficha .med{ flex:1; min-width:0; display:flex; flex-direction:column; gap:6px; }
.nombre{ font-family:var(--m-titulo); font-size:var(--m-titulo-px,15px); font-weight:var(--m-titulo-peso,600); letter-spacing:var(--m-titulo-esp,0); text-transform:var(--m-titulo-caja,none); color:var(--m-tinta); line-height:1.2; text-shadow:var(--m-titulo-sombra,none); }
.barra{ height:7px; border-radius:var(--m-r-barra); background:var(--m-carril); overflow:hidden; }
.barra i{ display:block; height:100%; width:68%; border-radius:var(--m-r-barra); background:var(--m-acento); box-shadow:var(--m-halo,none); transform-origin:left center; transform:scaleX(0); transition:transform var(--m-dur,.5s) var(--m-curva,ease); }
.mundo.visto .barra i{ transform:scaleX(1); }
@media (prefers-reduced-motion:reduce){ .barra i{ transition:none; transform:scaleX(1); } }
.pie{ font-size:11.5px; color:var(--m-tinta-2); }
.tira{ display:flex; gap:7px; flex-wrap:wrap; align-items:center; }
.chip{ font-size:11px; font-weight:var(--m-chip-peso,600); padding:4px 11px; border-radius:var(--m-r-chip); font-family:var(--m-chip-fuente,inherit); letter-spacing:var(--m-chip-esp,0); text-transform:var(--m-chip-caja,none); }
/* La tinta de un chip NO puede ser del mismo tono que su velo. El velo tiñe
   el fondo hacia ese mismo color, así que el texto y lo que hay detrás se
   acercan y el contraste se hunde: medidos, nueve chips de cinco mundos
   estaban por debajo de 4,5 y ninguno se veía en las otras medidas, porque
   hasta ahora el arnés no miraba los chips. Se empujan hacia la tinta del
   mundo —clara u oscura, la que sea— que es la misma idea de `--mint` y
   `--mint-macizo` en la app. */
.c-ok{ color:color-mix(in srgb, var(--m-acento-tinta,var(--m-acento)) 70%, var(--m-tinta)); background:var(--m-acento-velo); }
.c-av{ color:color-mix(in srgb, var(--m-aviso) 70%, var(--m-tinta)); background:var(--m-aviso-velo); }
.c-no{ color:color-mix(in srgb, var(--m-peligro) 70%, var(--m-tinta)); background:var(--m-peligro-velo); }
.cifra{ font-family:var(--m-cifra); font-variant-numeric:tabular-nums; font-size:30px; font-weight:var(--m-cifra-peso,700); letter-spacing:var(--m-cifra-esp,-.02em); color:var(--m-acento-tinta,var(--m-acento)); line-height:1; }
.cifra span{ font-size:12px; font-weight:500; color:var(--m-tinta-2); letter-spacing:.12em; margin-left:7px; font-family:var(--sans); }
.datos{ padding:22px 22px 24px; display:flex; flex-direction:column; gap:16px; border-left:1px solid var(--hilo); }
@media (max-width:780px){ .datos{ border-left:0; border-top:1px solid var(--hilo); } }
.hechos{ display:flex; flex-direction:column; }
.hecho{ display:grid; grid-template-columns:88px 1fr; gap:14px; padding:8px 0; border-top:1px solid var(--hilo); font-size:.89rem; }
.hecho:first-child{ border-top:0; }
.hecho dt{ font-family:var(--mono); font-size:.66rem; letter-spacing:.12em; text-transform:uppercase; color:var(--tinta-3); padding-top:4px; }
.hecho dd{ margin:0; color:var(--tinta-2); line-height:1.45; }
.hecho dd b{ color:var(--tinta); font-weight:600; }
.apunte{ font-size:.83rem; line-height:1.5; color:var(--tinta-3); border-left:2px solid var(--hilo-fuerte); padding-left:11px; margin:0; }
.esquinas{ display:grid; grid-template-columns:repeat(auto-fit,minmax(124px,1fr)); gap:12px; }
.esq{ display:flex; flex-direction:column; gap:9px; align-items:center; text-align:center; }
.esq .cuadro{ width:100%; height:58px; background:var(--menta-viva); opacity:.24; border:2px solid var(--menta); }
.esq b{ font-size:.84rem; font-weight:600; } .esq span{ font-family:var(--mono); font-size:.62rem; color:var(--tinta-3); letter-spacing:.06em; }
.tabla-caja{ overflow-x:auto; border:1px solid var(--hilo); border-radius:13px; }
table{ border-collapse:collapse; width:100%; min-width:760px; font-size:.88rem; }
th,td{ text-align:left; padding:10px 13px; border-bottom:1px solid var(--hilo); }
thead th{ font-family:var(--mono); font-size:.62rem; letter-spacing:.13em; text-transform:uppercase; color:var(--tinta-3); font-weight:500; background:var(--fondo-2); }
tbody tr:last-child td{ border-bottom:0; }
.num{ font-variant-numeric:tabular-nums; }
.paquete{ background:var(--sup); border:1px solid var(--hilo); border-radius:14px; padding:20px 22px 22px; display:flex; flex-direction:column; gap:12px; }
.paquete pre{ margin:0; font-family:var(--mono); font-size:.76rem; line-height:1.7; background:var(--fondo-2); border:1px solid var(--hilo); border-radius:10px; padding:13px 14px; overflow-x:auto; color:var(--tinta-2); }
.paquete pre b{ color:var(--tinta); font-weight:500; }
.cierre{ margin-top:66px; padding-top:26px; border-top:1px solid var(--hilo); font-size:1.06rem; color:var(--tinta-2); font-weight:300; max-width:62ch; }
"""

def pagina():
    css_mundos = "\n\n".join(bloque_css(m) for m in M)
    fam_html = []
    for i, (fid, fnombre, fdesc) in enumerate(FAM, 1):
        fichas = "\n".join(ficha_html(m) for m in M if m["familia"] == fid)
        fam_html.append(f"""<div class="familia">
  <div class="familia-cab"><span class="n">{i:02d}</span><h3>{fnombre}</h3><span class="d">{fdesc}</span></div>
  {fichas}
</div>""")
    return f"""<title>Trece mundos</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family={FUENTES}&display=swap">
<style>{CHROME}
/* ===== Los once mundos: solo variables, ninguna regla del componente ===== */
{css_mundos}
</style>

<div class="hoja">
<header>
  <div class="serie"><i></i><span class="rotulo">Norata · catálogo completo</span></div>
  <h1>Trece mundos</h1>
  <p class="tesis">Todo lo aprobado hasta hoy, junto: los de relato, los de aquí, los de pantalla y los de materia. <b>Cada uno con su letra medida y su escala comprobada.</b></p>
  <p class="entradilla">La misma pieza trece veces, con el CSS que se copiaría tal cual. Ninguno toca una regla de la app: todos son variables.</p>
</header>

<section>
  <div class="cabeza"><span class="rotulo">Lo que nadie puede saltarse</span><h2>Tres reglas con dueño</h2><div class="raya"></div></div>
  <div class="reglas">
    <div class="regla"><h3>Avisar sigue siendo avisar</h3><p>El amarillo y el coral pueden cambiar de tono —en Neón son ámbar y rosa, en Cyberpunk magenta— pero no de significado. Un mundo cambia con qué se celebra; no cambia con qué se avisa.</p></div>
    <div class="regla"><h3>Un círculo es redondo</h3><p>El aro de marcar una misión está en 999 px en los once, incluso donde todo lo demás tiene la esquina viva. Por eso <code>--r-redondo</code> vive separado de <code>--r-pastilla</code> y no pasa por el factor.</p></div>
    <div class="regla"><h3>El cuerpo no se toca</h3><p>Los nombres de misión, las descripciones y los botones van siempre en la letra de la casa. Un mundo solo llega a <code>h1/h2/h3</code> y a las cifras. Títulos cortos y dígitos: eso es todo lo que está en juego.</p></div>
  </div>
</section>

<section>
  <div class="cabeza"><span class="rotulo">Lo que te preocupaba</span><h2>Que no entren los textos</h2>
  <p style="color:var(--tinta-2);font-size:1rem;">Medido con las tipografías descargadas e incrustadas, no fiándome de lo que declara el CSS.</p><div class="raya"></div></div>
  <div class="banco">
    <span class="rotulo">El banco, medido en la app</span>
    <span class="cifrota">266 px</span>
    <p>Es lo que deja la cabecera en una pantalla de 320 px. El título más largo que existe en Norata es <strong>«Árbol de talentos»</strong>, y en la letra de casa ocupa 236,5 px. <strong>Sobran 38 px: un 16% de holgura.</strong></p>
  </div>
  <div class="pista">
    <div class="carril-cab"><span>Tipografía</span><span>«Árbol de talentos» · la raya roja es el límite</span><span>Veredicto</span></div>
    {pista_html()}
  </div>
  <p class="nota" style="margin-top:16px;">Hay un resultado incómodo: <strong>Poppins es un 11% más ancha que la letra que la app usa hoy</strong> y deja 3 px de margen. Fijarlo todo a Poppins no quitaría el riesgo — sería quedarse con el menor margen de las que pasan. Por eso la regla es otra: <strong>ninguna cara se descarta por ancha, se le declara su escala</strong>, y ese número está comprobado midiendo otra vez.</p>
</section>

<section>
  <div class="cabeza"><span class="rotulo">Los once</span><h2>Cuatro familias, trece mundos</h2>
  <p style="color:var(--tinta-2);font-size:1rem;">La misma pieza en todos: el aro de marcar, el icono, el título, la barra, las tres pastillas y una cifra. Es a propósito — así se comparan materiales y no maquetas distintas. Los especímenes no cambian con el modo de tu pantalla: un mundo trae su propia luz.</p><div class="raya"></div></div>
  {"".join(fam_html)}
</section>

<section>
  <div class="cabeza"><span class="rotulo">Que no se nos olviden</span><h2>Las esquinas también son el material</h2>
  <p style="color:var(--tinta-2);font-size:1rem;">La baraja recorre toda la escala, y no por variar: cada material se comporta como se comporta. Un bloque de imprenta no tiene curva; un tubo de neón no tiene otra cosa.</p><div class="raya"></div></div>
  <div class="esquinas">{esquinas_html()}</div>
</section>

<section>
  <div class="cabeza"><span class="rotulo">De un vistazo</span><h2>Los trece, con su letra y su escala</h2><div class="raya"></div></div>
  {tabla_html()}
</section>

<section>
  <div class="cabeza"><span class="rotulo">Para seguir en la computadora</span><h2>El paquete va en el repositorio</h2><div class="raya"></div></div>
  <div class="paquete">
    <p style="font-size:.97rem;color:var(--tinta-2);">Todo esto —las reglas, el banco de tipografías, los once bloques de variables listos para pegar y la receta de verificación— está commiteado en la rama del proyecto. En Claude Code de la computadora basta con decirle que lo lea:</p>
    <pre>Lee <b>mundos/MUNDOS.md</b> y sigue desde ahí.
Estamos en la rama <b>claude/norata-apariencias-skins-p52cpj</b>.</pre>
    <p style="font-size:.97rem;color:var(--tinta-2);">Y para verlo sin conexión: <code>mundos/vista.html</code> es esta misma página, guardada en el repositorio.</p>
  </div>
</section>

<p class="cierre">Trece mundos, una sola pieza para compararlos, y ninguno pide tocar una regla de la app. Lo que falta no es otro lote: es elegir tres y hacerlos de verdad.</p>
</div>

<script>
(() => {{
  "use strict";
  const f = document.querySelectorAll(".mundo");
  if (!("IntersectionObserver" in window)) {{ f.forEach(x => x.classList.add("visto")); return; }}
  const ojo = new IntersectionObserver(es => es.forEach(e => {{
    if (!e.isIntersecting) return; e.target.classList.add("visto"); ojo.unobserve(e.target);
  }}), {{ threshold:.3 }});
  f.forEach(x => ojo.observe(x));
}})();
</script>"""

if __name__ == "__main__":
    open("lote2.html","w",encoding="utf-8").write(pagina())
    print("lote2.html escrito ·", os.path.getsize("lote2.html"), "bytes")
