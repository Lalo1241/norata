// Va en android/app/src/main/java/<tu paquete>/, junto a MainActivity.java.
// La primera línea (`package`) tiene que ser LA MISMA que la de MainActivity.
package app.norata;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

/* Luciérnagas (2×2): una por misión de hoy. Ver `Pinta.luciernagas`. */
public class LuciernagasWidget extends WidgetNorata {
    @Override
    RemoteViews vista(Context c, AppWidgetManager m, int widget) { return Pinta.luciernagas(c, m, widget); }
}
