// Va en android/app/src/main/java/<tu paquete>/, junto a MainActivity.java.
// La primera línea (`package`) tiene que ser LA MISMA que la de MainActivity.
package app.norata;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

/* ============================================================
   Los widgets de Norata: las piezas compartidas
   ============================================================

   **La regla que lo ordena todo: el widget apunta, la app aplica.** Aquí no
   se suma XP, no se toca la racha y no se sincroniza nada. Lo que se marca en
   la pantalla de inicio queda en una cola con su día y su hora, y la página
   lo aplica al abrir por la misma puerta que un toque dentro de la app
   (`logMission`, js/04-misiones.js). Es el mecanismo de los avisos del
   Pomodoro (`jAplicarAvisos`), y por lo mismo: el estado de verdad es el de
   la página, que es la que sabe fusionar con otros dispositivos.

   **La página decide y esto pinta.** Lo que se enseña llega en una «foto»
   (`js/13c-widgets.js`): los próximos siete días con sus misiones y sus
   actividades, los textos en el idioma de la app y cada color ya resuelto
   para el mundo y el modo puestos. Un widget no lee CSS ni sabe de cadencias:
   solo elige el día de hoy dentro de la foto. Por eso viajan siete días y no
   uno — a medianoche tiene que cambiar de día sin que nadie abra la app.

   No depende de los avisos (`nativo/avisos/`): un APK puede traer uno sin el
   otro. Lo único que comparten son las letras de `res/font/`. */
final class Widgets {
    private Widgets() {}

    static final String PREFS = "norata-widgets";
    /* La acción del toque en una fila. Es un texto cualquiera, único en la app. */
    static final String MARCA = "norata.widgets.MARCA";
    static final String EXTRA_ID = "norataMision";
    /* El toque en el pie del widget: pasa a la página siguiente de la lista. */
    static final String PAGINA = "norata.widgets.PAGINA";
    static final String EXTRA_WIDGET = "norataWidgetId";
    /* Adónde abrir la app. Lo lee `WidgetsPlugin` al arrancar o en `handleOnNewIntent`. */
    static final String EXTRA_IR = "norataWidget";

    static volatile WidgetsPlugin instancia;

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    /* Por nombre y no por `R.id`: el paquete de estos archivos se reescribe al
       instalarlos y el `R` vive en el namespace de la app, que puede ser otro. */
    static int recurso(Context c, String tipo, String nombre) {
        return c.getResources().getIdentifier(nombre, tipo, c.getPackageName());
    }

    static int id(Context c, String nombre) { return recurso(c, "id", nombre); }

    /* ---------- La foto ---------- */
    static JSONObject foto(Context c) {
        String s = prefs(c).getString("foto", null);
        if (s == null) return new JSONObject();
        try { return new JSONObject(s); } catch (JSONException e) { return new JSONObject(); }
    }

    private static JSONArray cola(Context c) {
        String s = prefs(c).getString("cola", null);
        if (s == null) return new JSONArray();
        try { return new JSONArray(s); } catch (JSONException e) { return new JSONArray(); }
    }

    /* Una foto que llega con marcas todavía en la cola no las trae contadas:
       la página la armó antes de aplicarlas. Se le vuelven a poner encima, o
       el widget desmarcaría solo lo que acabas de marcar. */
    static synchronized void guardarFoto(Context c, JSONObject f) {
        if (f == null) f = new JSONObject();
        JSONArray cola = cola(c);
        for (int i = 0; i < cola.length(); i++) {
            JSONObject e = cola.optJSONObject(i);
            if (e == null) continue;
            JSONObject m = mision(f, e.optString("dia"), e.optString("id"));
            if (m == null) continue;
            int t = Math.max(1, m.optInt("t", 1));
            try { m.put("k", Math.max(0, Math.min(t, m.optInt("k") + e.optInt("d")))); } catch (JSONException x) { /* se queda como vino */ }
        }
        prefs(c).edit().putString("foto", f.toString()).apply();
    }

    private static JSONObject mision(JSONObject f, String dia, String id) {
        JSONObject dias = f.optJSONObject("dias");
        JSONObject d = dias == null ? null : dias.optJSONObject(dia);
        JSONArray ms = d == null ? null : d.optJSONArray("misiones");
        if (ms == null) return null;
        for (int i = 0; i < ms.length(); i++) {
            JSONObject m = ms.optJSONObject(i);
            if (m != null && id.equals(m.optString("id"))) return m;
        }
        return null;
    }

    /* ---------- El día del perfil ----------
       La zona es la del perfil, no la del teléfono: la misma que usan
       `todayKey` y las marcas de las misiones. Un viaje no cambia de día. */
    static Calendar ahora(JSONObject f) {
        String z = f.optString("zona", "");
        return Calendar.getInstance(z.isEmpty() ? TimeZone.getDefault() : TimeZone.getTimeZone(z));
    }

    static String hoy(JSONObject f) {
        Calendar k = ahora(f);
        return String.format(Locale.US, "%04d-%02d-%02d", k.get(Calendar.YEAR), k.get(Calendar.MONTH) + 1, k.get(Calendar.DAY_OF_MONTH));
    }

    static int minuto(JSONObject f) {
        Calendar k = ahora(f);
        return k.get(Calendar.HOUR_OF_DAY) * 60 + k.get(Calendar.MINUTE);
    }

    /* El mismo formato de la rueda del Pomodoro (js/09d-jornada.js). */
    static String hora(int min) {
        int m = ((min % 1440) + 1440) % 1440, h = m / 60;
        return String.format(Locale.US, "%d:%02d %s", h % 12 == 0 ? 12 : h % 12, m % 60, h < 12 ? "AM" : "PM");
    }

    /* ---------- Los textos y los colores ----------
       Los de aquí son solo el suelo, para un widget puesto antes de abrir la
       app por primera vez después de instalar. */
    static String tx(JSONObject f, String llave, String suelo) {
        JSONObject t = f.optJSONObject("textos");
        String v = t == null ? "" : t.optString(llave, "");
        return v.isEmpty() ? suelo : v;
    }

    static int color(JSONObject f, String llave, String suelo) {
        JSONObject col = f.optJSONObject("colores");
        return tono(col == null ? null : col.optString(llave, null), suelo);
    }

    static int tono(String hex, String suelo) {
        try { return Color.parseColor(hex == null || hex.isEmpty() ? suelo : hex); }
        catch (IllegalArgumentException e) { return Color.parseColor(suelo); }
    }

    /* `t` de `a` sobre `b`, opaco: un widget no sabe de transparencias sobre su propio fondo. */
    static int mezcla(int a, int b, float t) {
        return Color.rgb(
                Math.round(Color.red(a) * t + Color.red(b) * (1 - t)),
                Math.round(Color.green(a) * t + Color.green(b) * (1 - t)),
                Math.round(Color.blue(a) * t + Color.blue(b) * (1 - t)));
    }

    /* ---------- Lo que toca hoy ----------
       El orden es el del boceto que aprobó Eduardo: arriba, fija, la actividad
       en curso (o la que sigue); en la lista, las misiones pendientes, luego
       las actividades que vienen y al final las misiones ya cumplidas. Lo
       calculan igual la cabecera y la lista, y por eso vive en un solo sitio. */
    static final class Plan {
        boolean hayDia;
        JSONObject tira;
        boolean enCurso;
        int total, hechas;
        final List<JSONObject> filas = new ArrayList<>();
    }

    static boolean cumplida(JSONObject m) {
        return m.optInt("k") >= Math.max(1, m.optInt("t", 1));
    }

    static Plan plan(JSONObject f) {
        Plan p = new Plan();
        JSONObject dias = f.optJSONObject("dias");
        JSONObject d = dias == null ? null : dias.optJSONObject(hoy(f));
        if (d == null) return p;
        p.hayDia = true;
        int ahora = minuto(f);

        List<JSONObject> luego = new ArrayList<>();
        JSONArray bs = d.optJSONArray("bloques");
        for (int i = 0; bs != null && i < bs.length(); i++) {
            JSONObject b = bs.optJSONObject(i);
            if (b == null) continue;
            int a = b.optInt("a"), z = b.optInt("b");
            int dur = ((z - a + 1440) % 1440) == 0 ? 1440 : (z - a + 1440) % 1440;
            if (((ahora - a + 1440) % 1440) < dur) { if (p.tira == null) { p.tira = b; p.enCurso = true; } }
            else if (a > ahora) luego.add(b);
        }
        Collections.sort(luego, (x, y) -> x.optInt("a") - y.optInt("a"));
        if (p.tira == null && !luego.isEmpty()) p.tira = luego.remove(0);

        List<JSONObject> hechas = new ArrayList<>();
        JSONArray ms = d.optJSONArray("misiones");
        for (int i = 0; ms != null && i < ms.length(); i++) {
            JSONObject m = ms.optJSONObject(i);
            if (m == null) continue;
            p.total++;
            if (cumplida(m)) { p.hechas++; hechas.add(m); } else p.filas.add(m);
        }
        p.filas.addAll(luego);
        p.filas.addAll(hechas);
        return p;
    }

    /* ---------- Las páginas ----------
       La lista NO se desliza (0.7.197.1). En el teléfono de Eduardo el
       lanzador inclina y deforma el widget entero mientras hay un dedo
       arrastrando encima, y ese es justo el gesto de deslizar una lista: se
       veía tosco, y desde un widget esa animación no se puede apagar. Así que
       cada widget enseña solo las filas que le caben y un pie que pasa a las
       siguientes con un toque: «3 más», y al final «Volver arriba».

       `caben_<id>` lo apunta `HoyWidget.pintar`, que es quien sabe cuánto mide
       ese widget; 0 quiere decir que entra todo y no hay pie. Devuelve
       { desde, hasta, las que quedan después }. */
    static int[] tramo(Context c, int widget, int n) {
        int caben = prefs(c).getInt("caben_" + widget, 0);
        if (caben <= 0 || n <= caben) return new int[] { 0, n, 0 };
        int pag = prefs(c).getInt("pag_" + widget, 0);
        if (pag < 0 || pag * caben >= n) pag = 0;
        int desde = pag * caben, hasta = Math.min(n, desde + caben);
        return new int[] { desde, hasta, n - hasta };
    }

    static void pasarPagina(Context c, int widget) {
        int caben = prefs(c).getInt("caben_" + widget, 0);
        int n = plan(foto(c)).filas.size();
        int pag = prefs(c).getInt("pag_" + widget, 0) + 1;
        if (caben <= 0 || pag * caben >= n) pag = 0;
        prefs(c).edit().putInt("pag_" + widget, pag).apply();
    }

    /* ---------- La cola ----------
       Un toque suma una; sobre una misión de una vez ya cumplida, la deshace
       (lo mismo que su botón dentro de la app). Una de varias veces ya
       completa no hace nada, también como dentro.

       Marcar y desmarcar seguido se anula AQUÍ y no llega a la app: aplicar
       las dos daría y quitaría el XP, y dejaría dos renglones en el registro
       de la habilidad por algo que no pasó. */
    static synchronized boolean marcar(Context c, String id) {
        if (id == null || id.isEmpty()) return false;
        JSONObject f = foto(c);
        String hoy = hoy(f);
        JSONObject m = mision(f, hoy, id);
        if (m == null) return false;
        int t = Math.max(1, m.optInt("t", 1)), k = m.optInt("k");
        int d = k < t ? 1 : t == 1 ? -1 : 0;
        if (d == 0) return false;
        try {
            m.put("k", k + d);
            JSONArray cola = cola(c);
            boolean anulada = false;
            for (int i = cola.length() - 1; i >= 0 && !anulada; i--) {
                JSONObject e = cola.optJSONObject(i);
                if (e != null && id.equals(e.optString("id")) && hoy.equals(e.optString("dia")) && e.optInt("d") == -d) {
                    cola.remove(i);
                    anulada = true;
                }
            }
            if (!anulada) {
                JSONObject e = new JSONObject();
                e.put("id", id); e.put("dia", hoy); e.put("d", d); e.put("t", System.currentTimeMillis());
                cola.put(e);
            }
            prefs(c).edit().putString("foto", f.toString()).putString("cola", cola.toString()).apply();
        } catch (JSONException e) { return false; }
        return true;
    }

    static synchronized JSONArray vaciarCola(Context c) {
        JSONArray cola = cola(c);
        prefs(c).edit().remove("cola").apply();
        return cola;
    }

    /* ---------- Repintar ---------- */
    static int[] puestos(Context c) {
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        return m == null ? new int[0] : m.getAppWidgetIds(new ComponentName(c, HoyWidget.class));
    }

    static void refrescar(Context c) {
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        int[] ids = puestos(c);
        if (m == null || ids.length == 0) return;
        for (int id : ids) HoyWidget.pintar(c, m, id);
        m.notifyAppWidgetViewDataChanged(ids, id(c, "wh_lista"));
    }

    /* Tocar la cabecera abre la app en Misiones. `singleTask` en MainActivity:
       no se abre otra encima. El código distingue un destino de otro, porque
       Android compara dos `PendingIntent` SIN mirar sus extras. */
    static PendingIntent abrir(Context c, String ir, int codigo) {
        Intent i = c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());
        if (i == null) i = new Intent(Intent.ACTION_MAIN).setPackage(c.getPackageName());
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        i.putExtra(EXTRA_IR, ir);
        return PendingIntent.getActivity(c, codigo, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /* ---------- Los dibujos ----------
       Un widget solo sabe de marcos, textos e imágenes, así que lo que cambia
       de forma se dibuja aquí y viaja como imagen: la casilla (un aro del
       color de la misión, o el disco verde con su palomita), el cuadrito de
       una actividad y el aro del avance del día. */
    private static float dp(Context c, float v) { return v * c.getResources().getDisplayMetrics().density; }

    private static Paint pincel(int color, boolean trazo, float ancho) {
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);
        p.setColor(color);
        p.setStyle(trazo ? Paint.Style.STROKE : Paint.Style.FILL);
        p.setStrokeWidth(ancho);
        p.setStrokeCap(Paint.Cap.ROUND);
        p.setStrokeJoin(Paint.Join.ROUND);
        return p;
    }

    static Bitmap casilla(Context c, int color, boolean hecha, int hecho, int sobre) {
        int n = Math.round(dp(c, 22));
        Bitmap b = Bitmap.createBitmap(n, n, Bitmap.Config.ARGB_8888);
        Canvas k = new Canvas(b);
        float g = dp(c, 2), r = n / 2f;
        if (!hecha) {
            k.drawCircle(r, r, r - g / 2, pincel(color, true, g));
            return b;
        }
        k.drawCircle(r, r, r, pincel(hecho, false, 0));
        float u = n / 22f;
        Path p = new Path();
        p.moveTo(6.6f * u, 11.4f * u);
        p.lineTo(9.6f * u, 14.4f * u);
        p.lineTo(15.4f * u, 8.2f * u);
        k.drawPath(p, pincel(sobre, true, dp(c, 2.2f)));
        return b;
    }

    static Bitmap cuadrito(Context c, int color) {
        int n = Math.round(dp(c, 22));
        Bitmap b = Bitmap.createBitmap(n, n, Bitmap.Config.ARGB_8888);
        float m = dp(c, 6), r = dp(c, 3);
        new Canvas(b).drawRoundRect(new RectF(m, m, n - m, n - m), r, r, pincel(color, false, 0));
        return b;
    }

    static Bitmap aro(Context c, float parte, int carril, int color) {
        int n = Math.round(dp(c, 18));
        Bitmap b = Bitmap.createBitmap(n, n, Bitmap.Config.ARGB_8888);
        Canvas k = new Canvas(b);
        float g = dp(c, 3);
        RectF caja = new RectF(g / 2, g / 2, n - g / 2, n - g / 2);
        k.drawOval(caja, pincel(carril, true, g));
        if (parte > 0) k.drawArc(caja, -90, 360 * Math.min(1, parte), false, pincel(color, true, g));
        return b;
    }
}
