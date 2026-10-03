// Va en android/app/src/main/java/<tu paquete>/, junto a MainActivity.java.
// La primera línea (`package`) tiene que ser LA MISMA que la de MainActivity.
package app.norata;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

/* Por cuidar (2×2): la habilidad más descuidada. Ver `Pinta.habilidad`. */
public class HabilidadWidget extends WidgetNorata {
    @Override
    RemoteViews vista(Context c, AppWidgetManager m, int widget) { return Pinta.habilidad(c, m, widget); }
}
