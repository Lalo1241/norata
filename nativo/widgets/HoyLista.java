// Va en android/app/src/main/java/<tu paquete>/, junto a MainActivity.java.
// La primera línea (`package`) tiene que ser LA MISMA que la de MainActivity.
package app.norata;

import android.content.Context;
import android.content.Intent;
import android.graphics.Paint;
import android.view.View;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/* La lista del widget «Hoy». Android la pide fila por fila, y por eso se
   desliza dentro del widget: es lo único de un widget que sabe hacerlo.

   Una fila es una misión (con casilla: tocarla la marca) o una actividad de
   la rueda (con su cuadrito y su hora: no se toca). Se distinguen porque solo
   la misión trae `id`. */
public class HoyLista extends RemoteViewsService {

    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new Fabrica(getApplicationContext());
    }

    private static final class Fabrica implements RemoteViewsFactory {
        private final Context c;
        private JSONObject foto = new JSONObject();
        private List<JSONObject> filas = new ArrayList<>();

        Fabrica(Context c) { this.c = c; }

        @Override public void onCreate() {}
        @Override public void onDestroy() {}

        @Override
        public void onDataSetChanged() {
            foto = Widgets.foto(c);
            filas = Widgets.plan(foto).filas;
        }

        @Override public int getCount() { return filas.size(); }
        @Override public int getViewTypeCount() { return 1; }
        @Override public long getItemId(int i) { return i; }
        @Override public boolean hasStableIds() { return false; }
        @Override public RemoteViews getLoadingView() { return null; }

        @Override
        public RemoteViews getViewAt(int i) {
            int molde = Widgets.recurso(c, "layout", "widget_hoy_fila");
            if (molde == 0 || i < 0 || i >= filas.size()) return null;
            JSONObject o = filas.get(i);
            RemoteViews v = new RemoteViews(c.getPackageName(), molde);
            int texto = Widgets.color(foto, "texto", "#eef3f1"), suave = Widgets.color(foto, "suave", "#93a0ab");
            int nom = Widgets.id(c, "wf_nom"), de = Widgets.id(c, "wf_de"), marca = Widgets.id(c, "wf_marca");
            int tono = Widgets.tono(o.optString("c", null), "#93a0ab");

            v.setViewVisibility(Widgets.id(c, "wf_raya"), i == 0 ? View.INVISIBLE : View.VISIBLE);
            v.setInt(Widgets.id(c, "wf_raya"), "setColorFilter", Widgets.color(foto, "raya", "#2a323c"));
            v.setTextViewText(nom, o.optString("n", ""));

            boolean mision = o.has("id");
            if (!mision) {
                v.setImageViewBitmap(marca, Widgets.cuadrito(c, tono));
                v.setTextColor(nom, texto);
                v.setInt(nom, "setPaintFlags", Paint.ANTI_ALIAS_FLAG);
                v.setTextViewText(de, Widgets.hora(o.optInt("a")));
                v.setTextColor(de, suave);
                // Sin esto la fila hereda el molde de la lista y un toque buscaría una misión que no hay.
                v.setOnClickFillInIntent(Widgets.id(c, "wf_fila"), new Intent());
                return v;
            }

            boolean hecha = Widgets.cumplida(o);
            int t = Math.max(1, o.optInt("t", 1));
            v.setImageViewBitmap(marca, Widgets.casilla(c, tono, hecha,
                    Widgets.color(foto, "hecho", "#5fe0b0"), Widgets.color(foto, "sobre", "#10151d")));
            v.setTextColor(nom, hecha ? suave : texto);
            v.setInt(nom, "setPaintFlags", Paint.ANTI_ALIAS_FLAG | (hecha ? Paint.STRIKE_THRU_TEXT_FLAG : 0));
            // Una misión de varias veces dice por dónde va; las demás, la habilidad que alimentan.
            v.setTextViewText(de, t > 1
                    ? Widgets.tx(foto, "de", "{a} de {b}").replace("{a}", String.valueOf(o.optInt("k"))).replace("{b}", String.valueOf(t))
                    : o.optString("de", ""));
            v.setTextColor(de, suave);
            v.setOnClickFillInIntent(Widgets.id(c, "wf_fila"), new Intent().putExtra(Widgets.EXTRA_ID, o.optString("id")));
            return v;
        }
    }
}
