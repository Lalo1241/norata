/**
 * La hoja de Google de la que Framer sincroniza el changelog del sitio.
 *
 * Este archivo NO corre aquí: es la copia versionada de lo que está pegado en
 * Extensiones → Apps Script de esa hoja. Si se cambia, se vuelve a pegar allá.
 *
 * Por qué un script y no =IMPORTDATA(): esa fórmula solo se refresca con la
 * hoja abierta, y Framer la lee cerrada. Un activador por tiempo corre igual
 * con todo cerrado.
 */
const CSV = "https://mi.norata.app/novedades/framer.csv";

/** Se corre UNA vez a mano: deja el activador de cada hora y hace la primera carga. */
function instalar() {
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === "sincronizar")
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("sincronizar").timeBased().everyHours(1).create();
  sincronizar();
}

function sincronizar() {
  // El `?x=` es para que la caché de GitHub Pages no conteste con el de hace un rato.
  const r = UrlFetchApp.fetch(CSV + "?x=" + Date.now(), { muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw new Error("El CSV contestó " + r.getResponseCode());

  const filas = Utilities.parseCsv(r.getContentText("UTF-8"));
  // Todo lo que pueda salir mal sale ANTES de borrar: una página de error o un
  // archivo a medias no puede dejar el changelog del sitio en blanco.
  if (filas.length < 2 || filas[0][0] !== "Slug") throw new Error("Eso no es el CSV de novedades");
  const ancho = filas[0].length;
  if (filas.some((f) => f.length !== ancho)) throw new Error("El CSV trae filas de distinto ancho");

  const libro = SpreadsheetApp.getActiveSpreadsheet();
  // La PRIMERA pestaña, se llame como se llame: Framer se conectó a ella antes
  // de que este script existiera (se configuró con la hoja llena a mano), y
  // buscándola por nombre se habría creado otra al lado que Framer no mira.
  const hoja = libro.getSheets()[0];
  hoja.clearContents();
  // La versión es TEXTO: sin esto Google lee «0.8» y «1.0» como números y la
  // 1.0 llega a Framer como «1».
  const col = filas[0].indexOf("Versión") + 1;
  if (col) hoja.getRange(1, col, hoja.getMaxRows(), 1).setNumberFormat("@");
  hoja.getRange(1, 1, filas.length, ancho).setValues(filas);
  hoja.setFrozenRows(1);
}
