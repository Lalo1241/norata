// Va en android/app/src/main/java/<tu paquete>/, junto a MainActivity.java.
// La primera línea (`package`) tiene que ser LA MISMA que la de MainActivity.
package app.norata;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.widget.RemoteViews;

/* Racha (2×2): las semanas encendidas. Ver `Pinta.racha`. */
public class RachaWidget extends WidgetNorata {
    @Override
    RemoteViews vista(Context c, AppWidgetManager m, int widget) { return Pinta.racha(c, m, widget); }
}
