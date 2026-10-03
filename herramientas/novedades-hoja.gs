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

/**
 * Se corre UNA vez a mano: deja el activador y hace la primera carga.
 *
 * Cada 15 minutos y no cada hora (3 oct 2026): Eduardo aprobó, le dio Sync a
 * Framer y el sitio volvió a publicar lo viejo, porque la hoja todavía no
 * había tomado el CSV nuevo. El script no falló —doce corridas, doce
 * completadas—: llegó tarde. Con una hora de margen eso pasa casi siempre.
 */
function instalar() {
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === "sincronizar")
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("sincronizar").timeBased().everyMinutes(15).create();
  PropertiesService.getScriptProperties().deleteProperty("huella");
  sincronizar();
}

/** El CSV, con tres intentos: un corte de red de un momento no pierde la corrida. */
function bajar() {
  let fallo = "";
  for (let i = 0; i < 3; i++) {
    try {
      // El `?x=` es para que la caché de GitHub Pages no conteste con el de hace un rato.
      const r = UrlFetchApp.fetch(CSV + "?x=" + Date.now(), { muteHttpExceptions: true });
      if (r.getResponseCode() === 200) return r.getContentText("UTF-8");
      fallo = "El CSV contestó " + r.getResponseCode();
    } catch (e) {
      fallo = String(e);
    }
    Utilities.sleep(4000 * (i + 1));
  }
  throw new Error(fallo);
}

function sincronizar() {
  const texto = bajar();
  // Si es el mismo de la última vez, no se toca la hoja: corriendo cada 15
  // minutos, borrarla y reescribirla sin motivo es abrir 96 veces al día una
  // ventana en la que Framer podría leerla vacía.
  const props = PropertiesService.getScriptProperties();
  const huella = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, texto, Utilities.Charset.UTF_8));
  if (props.getProperty("huella") === huella) return;

  const filas = Utilities.parseCsv(texto);
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
  // Solo al final: si algo de arriba falla, la próxima corrida lo reintenta.
  props.setProperty("huella", huella);
}
