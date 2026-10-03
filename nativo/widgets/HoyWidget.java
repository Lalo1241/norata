// Va en android/app/src/main/java/<tu paquete>/, junto a MainActivity.java.
// La primera línea (`package`) tiene que ser LA MISMA que la de MainActivity.
package app.norata;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONObject;

/* El widget «Hoy»: la actividad que toca, las misiones del día con su casilla
   y las actividades que vienen. Qué se enseña y en qué orden lo decide
   `Widgets.plan`; aquí se pinta la cabecera y la tira de arriba, y la lista la
   llena `HoyLista`.

   La lista no se desliza: va por páginas, con un pie que pasa a la siguiente
   (ver «Las páginas» en `Widgets.java`, y por qué).

   Se repinta en cuatro momentos: cuando la página manda una foto nueva,
   cuando se toca una fila, cada media hora (`updatePeriodMillis`, que es lo
   que cambia de día a medianoche y mueve la tira de «Ahora») y al reiniciar
   el teléfono. Media hora es el mínimo que deja Android sin una alarma
   propia, así que la tira puede ir hasta media hora atrasada. */
public class HoyWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        for (int id : ids) pintar(c, m, id);
        m.notifyAppWidgetViewDataChanged(ids, Widgets.id(c, "wh_lista"));
    }

    @Override
    public void onReceive(Context c, Intent i) {
        if (i != null && Widgets.MARCA.equals(i.getAction())) {
            if (Widgets.marcar(c, i.getStringExtra(Widgets.EXTRA_ID))) {
                Widgets.refrescar(c);
                // Con la app viva (de fondo o a la vista) se aplica ya, sin esperar a que vuelva.
                WidgetsPlugin p = Widgets.instancia;
                if (p != null) p.hayMarcas();
            }
            return;
        }
        if (i != null && Widgets.PAGINA.equals(i.getAction())) {
            Widgets.pasarPagina(c, i.getIntExtra(Widgets.EXTRA_WIDGET, 0));
            Widgets.refrescar(c);
            return;
        }
        super.onReceive(c, i);
    }

    /* Al estirarlo o encogerlo caben otras filas: se vuelve a contar. */
    @Override
    public void onAppWidgetOptionsChanged(Context c, AppWidgetManager m, int id, Bundle opciones) {
        pintar(c, m, id);
        m.notifyAppWidgetViewDataChanged(id, Widgets.id(c, "wh_lista"));
    }

    private static void tenir(RemoteViews v, int vista, int color) {
        if (vista != 0) v.setInt(vista, "setColorFilter", color);
    }

    static void pintar(Context c, AppWidgetManager m, int widget) {
        int molde = Widgets.recurso(c, "layout", "widget_hoy");
        if (molde == 0) return;
        RemoteViews v = new RemoteViews(c.getPackageName(), molde);
        JSONObject f = Widgets.foto(c);
        Widgets.Plan p = Widgets.plan(f);

        int fondo = Widgets.color(f, "fondo", "#1b222c"), texto = Widgets.color(f, "texto", "#eef3f1"),
                suave = Widgets.color(f, "suave", "#93a0ab"), hecho = Widgets.color(f, "hecho", "#5fe0b0");
        tenir(v, Widgets.id(c, "wh_borde"), Widgets.color(f, "borde", "#2f5a52"));
        tenir(v, Widgets.id(c, "wh_fondo"), fondo);
        tenir(v, Widgets.id(c, "wh_ic"), Widgets.color(f, "marca", "#5fe0b0"));

        // La cabecera: el rótulo, la cuenta y el aro del día.
        boolean completo = p.total > 0 && p.hechas == p.total;
        v.setTextViewText(Widgets.id(c, "wh_titulo"), completo ? Widgets.tx(f, "completo", "Todo cumplido") : Widgets.tx(f, "hoy", "Hoy"));
        v.setTextColor(Widgets.id(c, "wh_titulo"), texto);
        String cuenta = "";
        if (p.total > 0) {
            cuenta = Widgets.tx(f, "de", "{a} de {b}").replace("{a}", String.valueOf(p.hechas)).replace("{b}", String.valueOf(p.total));
        } else if (p.hayDia) {
            JSONObject dias = f.optJSONObject("dias");
            JSONObject d = dias == null ? null : dias.optJSONObject(Widgets.hoy(f));
            cuenta = d == null ? "" : d.optString("fecha", "");
        }
        v.setTextViewText(Widgets.id(c, "wh_cuenta"), cuenta);
        v.setTextColor(Widgets.id(c, "wh_cuenta"), suave);
        v.setViewVisibility(Widgets.id(c, "wh_aro"), p.total > 0 ? View.VISIBLE : View.GONE);
        if (p.total > 0) {
            v.setImageViewBitmap(Widgets.id(c, "wh_aro"),
                    Widgets.aro(c, p.hechas / (float) p.total, Widgets.color(f, "carril", "#2c3744"), hecho));
        }

        // La tira: lo que toca ahora, o lo que sigue.
        v.setViewVisibility(Widgets.id(c, "wh_tira"), p.tira != null ? View.VISIBLE : View.GONE);
        if (p.tira != null) {
            int tono = Widgets.tono(p.tira.optString("c", null), "#9aa7b8");
            tenir(v, Widgets.id(c, "wh_tira_fondo"), Widgets.mezcla(tono, fondo, 0.17f));
            tenir(v, Widgets.id(c, "wh_tira_punto"), tono);
            v.setTextViewText(Widgets.id(c, "wh_tira_rot"), p.enCurso ? Widgets.tx(f, "ahora", "Ahora") : Widgets.tx(f, "sigue", "Sigue"));
            v.setTextColor(Widgets.id(c, "wh_tira_rot"), texto);
            v.setTextViewText(Widgets.id(c, "wh_tira_nom"), p.tira.optString("n", ""));
            v.setTextColor(Widgets.id(c, "wh_tira_nom"), texto);
            v.setTextViewText(Widgets.id(c, "wh_tira_de"), p.enCurso
                    ? Widgets.tx(f, "hasta", "hasta {h}").replace("{h}", Widgets.hora(p.tira.optInt("b")))
                    : Widgets.hora(p.tira.optInt("a")));
            v.setTextColor(Widgets.id(c, "wh_tira_de"), suave);
        }

        // Cuántas filas caben (ver «Las páginas» en Widgets.java). Las medidas son
        // las del molde, en dp: 12 de arriba, 24 de cabecera, 36 de la tira con su
        // margen, 4 sobre la lista y 6 de abajo; 37 por fila y 26 del pie.
        Bundle op = m.getAppWidgetOptions(widget);
        int alto = op == null ? 0 : op.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 0);
        if (alto <= 0) alto = 180;
        int libre = alto - 12 - 24 - (p.tira != null ? 36 : 0) - 4 - 6;
        int n = p.filas.size();
        int caben = n * 37 <= libre ? 0 : Math.max(1, (libre - 26) / 37);
        Widgets.prefs(c).edit().putInt("caben_" + widget, caben).apply();
        int[] t = Widgets.tramo(c, widget, n);
        boolean conPie = caben > 0 && n > caben;
        v.setViewVisibility(Widgets.id(c, "wh_pie"), conPie ? View.VISIBLE : View.GONE);
        if (conPie) {
            v.setTextViewText(Widgets.id(c, "wh_pie_tx"), t[2] > 0
                    ? Widgets.tx(f, "mas", "{n} más").replace("{n}", String.valueOf(t[2]))
                    : Widgets.tx(f, "arriba", "Volver arriba"));
            v.setTextColor(Widgets.id(c, "wh_pie_tx"), suave);
            tenir(v, Widgets.id(c, "wh_pie_ic"), suave);
            v.setFloat(Widgets.id(c, "wh_pie_ic"), "setRotation", t[2] > 0 ? 0f : 180f);
            // La dirección distingue el pie de un widget del de otro puesto al lado.
            Intent pag = new Intent(c, HoyWidget.class).setAction(Widgets.PAGINA)
                    .setData(Uri.parse("norata-widgets://pagina/" + widget)).putExtra(Widgets.EXTRA_WIDGET, widget);
            v.setOnClickPendingIntent(Widgets.id(c, "wh_pie"),
                    PendingIntent.getBroadcast(c, 7200, pag, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE));
        }

        // La lista. La dirección lleva el id del widget: sin ella Android reutiliza
        // el mismo servicio para dos widgets puestos a la vez.
        Intent lista = new Intent(c, HoyLista.class);
        lista.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widget);
        lista.setData(Uri.parse(lista.toUri(Intent.URI_INTENT_SCHEME)));
        v.setRemoteAdapter(Widgets.id(c, "wh_lista"), lista);
        v.setEmptyView(Widgets.id(c, "wh_lista"), Widgets.id(c, "wh_vacio"));

        // Cada fila rellena este molde con su misión. Tiene que ser mutable para eso.
        Intent marca = new Intent(c, HoyWidget.class).setAction(Widgets.MARCA);
        int banderas = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0);
        v.setPendingIntentTemplate(Widgets.id(c, "wh_lista"), PendingIntent.getBroadcast(c, 7100, marca, banderas));

        // Sin nada que listar: o no hay misiones hoy, o la app lleva más de una
        // semana sin abrirse y la foto ya no llega a este día.
        v.setTextViewText(Widgets.id(c, "wh_vacio_tx"), p.hayDia
                ? Widgets.tx(f, "vacio", "Hoy no tienes misiones.")
                : Widgets.tx(f, "abre", "Abre Norata para ver tu día."));
        v.setTextColor(Widgets.id(c, "wh_vacio_tx"), suave);
        tenir(v, Widgets.id(c, "wh_vacio_b_fondo"), Widgets.color(f, "boton", "#5fe0b0"));
        v.setTextViewText(Widgets.id(c, "wh_vacio_b_tx"), p.hayDia ? Widgets.tx(f, "apuntar", "Apuntar una") : Widgets.tx(f, "abrir", "Abrir"));
        v.setTextColor(Widgets.id(c, "wh_vacio_b_tx"), Widgets.color(f, "sobre", "#10151d"));
        v.setOnClickPendingIntent(Widgets.id(c, "wh_vacio_b"), Widgets.abrir(c, p.hayDia ? "nueva" : "missions", p.hayDia ? 7102 : 7103));

        v.setOnClickPendingIntent(Widgets.id(c, "wh_cab"), Widgets.abrir(c, "missions", 7101));
        m.updateAppWidget(widget, v);
    }
}
