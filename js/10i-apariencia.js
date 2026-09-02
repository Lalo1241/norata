/* ================= Las apariencias =================
   Encender otra piel de Norata. Lo que hace este archivo y nada más: leer la
   elección, comprobar que se puede, aplicarla y guardarla.

   Dos palabras y no son intercambiables — están definidas en
   `apariencias/LEEME.md`, que es el documento que manda:

     ambiente   un RECOLOR. Reusa el material que ya hay y le cambia la luz.
                Son siete, viven en `css/ambientes.css` y viajan con la app
                porque pesan seis kilobytes entre todos.
     mundo      cambia el MATERIAL: otra superficie, otro marco, otra letra y
                otro peso al moverse. Pesa entre 28 y 180 KB, así que NO viaja
                con la app: se pide el día que se enciende.

   Son EXCLUYENTES, y por eso esto es un atributo y no una clase: un mundo
   declara sus propios colores, así que un ambiente por debajo no se vería.
   Con `data-apariencia` el modelo se hace cumplir solo, porque un atributo no
   puede llevar dos valores a la vez. El modo claro sigue siendo la clase
   `claro` y es un eje aparte: cada apariencia tiene sus dos caras. */

const APARIENCIA_LLAVE = "norata-apariencia";
const APARIENCIA_PRUEBA = "norata-apariencia-prueba";

/* Los siete ambientes. `abre` es el nivel de expedición que los desbloquea, y
   hoy ese nivel NO EXISTE —la app da niveles por habilidad y nadie suma el
   total—, así que la puerta está escrita pero todavía no la guarda nadie: ver
   `aparienciaDisponible`. Los tonos de cada uno están en `css/ambientes.css`
   y salen medidos de `apariencias/datos.py`. */
const AMBIENTES = [
  { id: "casa",     nombre: "Noche de expedición", grado: 0, abre: 0,  icon: "compass" },
  /* Gratis siempre y no por generosidad: para quien no distingue bien los
     colores, un monocromo no es un adorno — es la única manera de usar la
     app. Cobrarlo sería cobrar por entrar. */
  { id: "tinta",    nombre: "Tinta",    grado: 3, abre: 0,  icon: "pen" },
  { id: "musgo",    nombre: "Musgo",    grado: 1, abre: 3,  icon: "plant" },
  { id: "marea",    nombre: "Marea",    grado: 2, abre: 5,  pro: true, icon: "globe" },
  { id: "adobe",    nombre: "Adobe",    grado: 1, abre: 7,  icon: "sol" },
  { id: "escarcha", nombre: "Escarcha", grado: 2, abre: 12, pro: true, icon: "luna" },
  { id: "duna",     nombre: "Duna",     grado: 1, abre: 20, icon: "star" }
];

/* ================= Los mundos =================
   Un mundo cambia el MATERIAL, no la luz — y desde el 30 de agosto cambia una
   cosa más: **te renombra el camino**. Los cinco rangos de la casa —Nodo,
   Enlace, Rama, Trama, Red— son de la app; un mundo trae los suyos, con sus
   nombres y sus dibujos, alineados a su tema. Eso es lo que separa una piel de
   un mundo, y es lo que se vende: un recolor te cambia la luz; un mundo te
   cambia hasta cómo se llama lo que llevas recorrido.

   Los NIVELES de entrada no se tocan nunca, y es a propósito: si cada mundo
   moviera los peldaños, dos personas con el mismo nivel estarían en sitios
   distintos de la escalera. Una sola escalera, muchos vocabularios.

   **Un rango puede traer además una `linea`**, que es lo que se lee debajo de
   «Ahora eres X» el día que se estrena — y solo ese día, que son cinco veces
   en toda la vida de una cuenta. Es un campo opcional de CUALQUIER rango y no
   una cosa de un mundo: la casa no trae ninguna, Averno trae sus cinco
   versículos y el día que Reliquia quiera su cédula de museo se la escribe.
   `{ texto, fuente }`, y la fuente se pinta aparte — una cita tiene que verse
   citada o parece que la escribió la app. Lo pintó `js/02-progreso.js`.

   De los quince, tres están construidos —Reliquia, Blueprint y Averno— y son
   los que llevan `listo: true`. Con cualquier otra apariencia puesta,
   `rangosDeApariencia()` devuelve null y manda la casa. Los dibujos de los
   rangos viajan con su mundo y no con la app: meter en ICONS los cinco rangos
   de quince mundos serían setenta y cinco dibujos que se baja todo el mundo
   para no usar ninguno. */
const MUNDOS = [
  {
    id: "arboleda", nombre: "Arboleda",
    /* Los cinco que se habían dibujado para la app y que Eduardo movió aquí:
       de la tierra al cielo, que es lo que hace que cada uno se le ocurra solo
       al anterior. En un bosque no eres un nodo de una red: eres lo que crece. */
    rangos: [
      { nombre: "Semilla", trazo: '<path d="M12 3.4c4 3.4 6.3 7 6.3 10.6 0 3.8-2.8 6.8-6.3 6.8s-6.3-3-6.3-6.8c0-3.6 2.3-7.2 6.3-10.6z"/><path d="M12 9.4v8.4"/>' },
      { nombre: "Brote",   trazo: '<path d="M12 20.6v-8"/><path d="M12 15.4c-3.6 0-6-2.3-6-5.8 3.9-.4 6 2.2 6 5.8z"/><path d="M12 13.2c0-3.7 2.4-6.2 6.2-5.9 0 3.6-2.5 5.9-6.2 5.9z"/><path d="M6 20.6h12"/>' },
      { nombre: "Refugio", trazo: '<path d="M12 4.6L2.8 19.6h18.4z"/><path d="M12 4.6L8.4 19.6 12 15.2l3.6 4.4z"/>' },
      { nombre: "Cima",    trazo: '<path d="M3 19.2l7-11.2 4 5.7 2.2-2.9 5.8 8.4z"/><path d="M10 8V3.4"/><path d="M10 3.9l4.4 1.5L10 7z"/>' },
      { nombre: "Norte",   trazo: '<path d="M12 2.6l2.5 6.9 6.9 2.5-6.9 2.5-2.5 6.9-2.5-6.9L2.6 12l6.9-2.5z"/>' }
    ]
  },
  /* Averno es el tercero construido, y con él se cierra la pareja que
     `mundos/MUNDOS.md` puso por delante. Va con Pro como los otros doce: de
     los quince, el único que no abre Pro es Reliquia, que es de Fundador.

     **El concepto es demonología cristiana, y lo pidió Eduardo.** Los cinco
     rangos fueron antes los estados del fuego —Ceniza, Chispa, Brasa, Llama,
     Hoguera— y se cambiaron enteros: describían una fogata, que es el tema
     visual del mundo pero no su concepto.

     La línea que separa esto de un disfraz —y es la que hay que sostener al
     tocar cualquier cosa de Averno— es **teología, no utilería**. Cada peldaño
     cita un texto y ninguno es un cuerno, un tridente ni un diablillo: eso es
     lo que se ve infantil, y es exactamente lo que Eduardo pidió evitar.

       Ceniza    «polvo y ceniza» (Job 42:6)
       Sello     el sello con el que se ata y se nombra (Apocalipsis 20:1-3,
                 y los sellos de la Llave Menor de Salomón)
       Leviatán  «no hay sobre la tierra quien se le parezca» (Job 41:33)
       Legión    «Legión me llamo, porque somos muchos» (Marcos 5:9)
       Abadón    el ángel del abismo, rey de las langostas del pozo
                 (Apocalipsis 9:11)

     El orden lo puso Eduardo, y es el que hace que la escalera suba de verdad:
     **lo que quedó, lo que tiene nombre, lo que es grande, lo que es muchos y
     quien reina sobre ellos**. Los dos primeros son cosas y los tres últimos
     son seres, así que el salto de peldaño 2 a 3 es además el salto de ser
     algo a ser alguien.

     Antes iba «Azufre» de segundo, y era el único que no encajaba: una
     sustancia entre cuatro entidades. Su dibujo era ya la cruz de Leviatán, o
     sea que el glifo llevaba el nombre de otro peldaño puesto encima.

     Y pasan las otras dos pruebas que dejó escrita la tanda de Blueprint: de
     todos se puede decir «soy», y **ninguno inflexiona** —dos son cosas y tres
     son nombres propios—, así que «Ahora eres Leviatán» le dice lo mismo a
     todo el mundo. Los títulos de la Goetia —Duque, Marqués, Conde—
     eran lo primero que pedía el tema y se descartaron por eso, no por el
     concepto: es el mismo fallo que costó cambiar «Arquitecto» en Blueprint.

     **Los dibujos son glifos, no criaturas.** Un caput mortuum, un sello
     inscrito, la cruz de Leviatán, tres siluetas encapuchadas y el pentagrama
     invertido. Cinco siluetas que no se parecen entre sí, que es la prueba que
     hay que pasar antes de mirar si cada una es bonita. Una criatura dibujada a 20 px —que es el tamaño al que se pintan—
     solo puede salir caricatura; un glifo a ese tamaño se lee, y además es lo
     que de verdad usaba la tradición. Lo que da el miedo en los dos que llevan
     figura es el HUECO RELLENO, no el detalle: un vacío pintado se lee a
     cualquier tamaño.

     **Ceniza va primero y se queda, decidido por Eduardo.** Queda escrito
     porque el reparo se le ocurre a cualquiera que lo mire: la ceniza es lo
     que queda DESPUÉS del fuego, así que como escalera parece del revés. No
     lo es — el arco es «de las cenizas», que se entiende solo y es el que hace
     que el primer peldaño signifique algo: no empiezas en nada, empiezas en lo
     que quedó. Se propuso Yesca y se descartó. No volver a proponerlo. */
  { id: "averno", nombre: "Averno", listo: true, pro: true, icon: "eclipse",
    premisa: "Piedra quemada con la brasa debajo, y los círculos del poema. Demonología de la que se lee, no de la que se disfraza.",
    rangos: [
      /* **Caput mortuum**, la «cabeza muerta»: el nombre que la alquimia le dio
         al residuo que queda en el fondo después de calcinar, lo que ya no
         sirve para nada más. Es literalmente el concepto de este peldaño, y
         por eso sustituye al montón de ceniza que había antes — «no evoca un
         concepto interesante, ni se entiende», y las dos cosas eran ciertas:
         un montón con una voluta es un montón de cualquier cosa.

         El cráneo es además memento mori, que es cristiano y viejo, no de
         película. Y es la silueta más distinta de las cinco, así que se
         reconoce antes de mirarlo. */
      { nombre: "Ceniza", trazo: '<path d="M12 3.2c4.3 0 7.4 3.1 7.4 7.3 0 2.2-.9 3.6-1.9 4.5-.5.5-.8 1-.8 1.7v1.5c0 1-.8 1.8-1.8 1.8H9.1c-1 0-1.8-.8-1.8-1.8v-1.5c0-.7-.3-1.2-.8-1.7-1-.9-1.9-2.3-1.9-4.5 0-4.2 3.1-7.3 7.4-7.3z"/><ellipse cx="8.9" cy="11.2" rx="1.9" ry="2.2" fill="currentColor" stroke="none"/><ellipse cx="15.1" cy="11.2" rx="1.9" ry="2.2" fill="currentColor" stroke="none"/><path d="M12 13.6l1.3 2.6h-2.6z" fill="currentColor" stroke="none"/>',
        linea: { texto: "Me arrepiento en polvo y ceniza.", fuente: "Job 42:6" } },
      /* **La cruz de Leviatán**, que es el signo del AZUFRE en su forma de cruz:
         doble travesaño sobre una lemniscata. Viene de la alquimía —el azufre
         es uno de los tres principios, con el mercurio y la sal— y de ahí pasó
         al ocultismo, que es por donde casi todo el mundo lo ha visto.

         Se cambió dos veces. El triángulo sobre cruz es el signo alquímico
         más literal del azufre, pero no se reconoce: dibujado a línea sale
         limpio de laboratorio y relleno sale pesado pero mudo. Éste sí se
         reconoce, y esa era la petición de Eduardo: «que se entienda que es
         con qué». Tiene nombre y se puede buscar.

         El sello: el anillo y la figura inscrita dentro. En esa tradición nada
         existe hasta que su sello está trazado, así que éste es el peldaño en
         el que dejas de ser un residuo y pasas a tener nombre.

         **Éste no se toca.** Llegó a ser un hexágono durante un rato: al pasar
         Abadón a pentagrama-en-círculo me pareció que dos glifos «redondos con
         figura dentro» se confundirían, y lo cambié por mi cuenta. Eduardo lo
         devolvió — el encargo era Ceniza, no éste—, y visto puesto tenía razón:
         un pentagrama y un triángulo dentro de un aro no se confunden, porque
         lo que separa un glifo de otro es la FIGURA y no el marco. */
      { nombre: "Sello", trazo: '<circle cx="12" cy="12" r="9.2"/><path d="M12 18.7L5.7 8.1h12.6z"/><circle cx="12" cy="11.4" r="1.7"/>',
        linea: { texto: "Lo ató, y puso su sello sobre él.", fuente: "Apocalipsis 20:2-3" } },
      /* **Leviatán**, y el dibujo pasó a llamarse como lo que ya era. El glifo
         no cambió ni un punto: es la cruz de Leviatán, que entró aquí como el
         signo del azufre y llevaba el nombre de otro peldaño encima. Con el
         reorden que pidió Eduardo el nombre y el dibujo por fin coinciden, que
         es lo que hace que un glifo se entienda sin pie de foto.

         Y de paso el rango deja de ser una sustancia para ser un ser, como los
         dos que vienen detrás. La escalera de arriba abajo queda: lo que
         quedó, lo que tiene nombre, lo que es grande, lo que es muchos y quien
         reina sobre ellos. */
      { nombre: "Leviatán", trazo: '<path d="M12 2.4v12.8"/><path d="M6.6 6h10.8M8.8 9.8h6.4"/><path d="M12 18.4c-1.5-2-2.7-2.9-4.1-2.9-1.5 0-2.6 1.2-2.6 2.7s1.1 2.7 2.6 2.7c1.4 0 2.6-.9 4.1-2.5z"/><path d="M12 18.4c1.5-2 2.7-2.9 4.1-2.9 1.5 0 2.6 1.2 2.6 2.7s-1.1 2.7-2.6 2.7c-1.4 0-2.6-.9-4.1-2.5z"/>',
        linea: { texto: "No hay sobre la tierra quien se le parezca.", fuente: "Job 41:33" } },
      /* Tres siluetas encapuchadas, LAS TRES IGUALES y la de en medio delante,
         con el hueco de la cara relleno. Dos correcciones seguidas:

         Primero eran cinco trazos verticales sobre una línea, y el problema no
         era el estilo: se leía como una GRÁFICA DE BARRAS. Después eran tres
         siluetas pero las de los lados iban abiertas y a otra escala, y la de
         la derecha «se veía muy distinta» — con razón: eran otro dibujo. Ahora
         es la MISMA figura tres veces, y lo único que cambia es el tamaño.

         El hueco relleno donde va la cara es lo que la vuelve demoníaca sin
         dibujar un demonio. Una cara a 20 px es una caricatura; un hueco a
         20 px es una presencia. */
      { nombre: "Legión", trazo: '<path d="M5.6 12.9c1.14 0 1.9.91 1.9 2.13 0 .61-.15 1.14-.46 1.52 1.14.53 1.82 1.52 1.82 2.96v1.9H2.34v-1.9c0-1.44.68-2.43 1.82-2.96-.3-.38-.46-.91-.46-1.52 0-1.22.76-2.13 1.9-2.13z"/><path d="M18.4 12.9c1.14 0 1.9.91 1.9 2.13 0 .61-.15 1.14-.46 1.52 1.14.53 1.82 1.52 1.82 2.96v1.9h-6.52v-1.9c0-1.44.68-2.43 1.82-2.96-.3-.38-.46-.91-.46-1.52 0-1.22.76-2.13 1.9-2.13z"/><path d="M12 10.2c1.5 0 2.5 1.2 2.5 2.8 0 .8-.2 1.5-.6 2 1.5.7 2.4 2 2.4 3.9v2.5H7.7v-2.5c0-1.9.9-3.2 2.4-3.9-.4-.5-.6-1.2-.6-2 0-1.6 1-2.8 2.5-2.8z"/><ellipse cx="12" cy="12.9" rx="1.35" ry="1.75" fill="currentColor" stroke="none"/>',
        linea: { texto: "Legión me llamo, porque somos muchos.", fuente: "Marcos 5:9" } },
      /* **Abadón**, y el quinto rango deja de ser un sitio para ser ALGUIEN.
         Era «Abismo» y su dibujo —el brocal que se estrecha con el hueco
         relleno— «parecía un paliacate de boca de vaquero», que es exactamente
         lo que era. Cambiar el dibujo no bastaba: el problema venía del
         concepto, porque un agujero no tiene silueta.

         Abadón sí. Apocalipsis 9:11 le pone nombre al rey de las langostas del
         pozo: «tienen por rey al ángel del abismo, cuyo nombre en hebreo es
         Abadón, y en griego Apolión». Es un ser y no un lugar, y además cierra
         mejor la escalera: de Legión —eres muchos— a Abadón —eres a quien esos
         muchos responden—.

         El dibujo es **el pentagrama invertido en su círculo**, y lo eligió
         Eduardo enseñando la imagen. Sustituye a la corona sobre la masa
         oscura, que se leía bien pero era un invento; ésta es la marca que
         cualquiera reconoce sin que se la expliquen, que es lo que se le pide
         al último peldaño.

         **El nombre se queda en Abadón** aunque el glifo ya no lo retrate: el
         pentagrama no es el emblema de un ser concreto sino el de la casa
         entera, y Abadón es quien reina en ella. Cambiarlo a Bafomet ataría el
         rango al dibujo, y de paso perdería la cita de Apocalipsis, que es lo
         que sostiene que esto sea teología y no utilería.

         Y con esto cae la línea que decía «nada de cuernos ni pentagramas» en
         la premisa del mundo: era mía, es de cuando el concepto era otro, y la
         decisión de ahora es de Eduardo. Lo que sigue en pie de aquella regla
         es lo que de verdad importaba: nada de diablillos ni tridentes. */
      { nombre: "Abadón", trazo: '<circle cx="12" cy="12" r="9.6"/><path d="M12 20.6L6.94 5.04L20.18 14.66L3.82 14.66L17.06 5.04z"/>',
        linea: { texto: "Su rey es el ángel del abismo, cuyo nombre es Abadón.", fuente: "Apocalipsis 9:11" } }
    ] },
  /* El nombre de éste está decidido; sus dibujos se hacen cuando se construya
     el mundo, con el resto de sus vectores. Escribirlo ahora sin dibujo no es
     una promesa a medias: mientras el mundo no exista, esta lista no la lee
     nadie. */
  { id: "consola",  nombre: "Consola",
    rangos: ["Bit", "Byte", "Proceso", "Núcleo", "Sistema"].map(n => ({ nombre: n })) },
  /* Blueprint es el segundo construido, y el orden lo dejó escrito
     `mundos/MUNDOS.md`: Averno y Blueprint por delante, pero el motor se
     estrena con los baratos, y Blueprint casi no lleva imágenes. Va con Pro y
     no con Fundador: de los quince mundos, el único que no abre Pro es
     Reliquia.

     Los cinco rangos son los OFICIOS del taller de dibujo, de quien afila
     lápices a quien firma el plano. Se cambiaron enteros porque los primeros
     —Boceto, Trazo, Plano, Corte, Obra— fallaban por dos sitios a la vez, y
     lo cerró Eduardo con una sola pregunta: «¿no te parece raro decir soy
     nivel Trazo?».

     El primero es que NO SUBEN. Un trazo es más pequeño que un boceto, y un
     corte no va después de un plano: es una VISTA de ese mismo plano. Una
     escalera cuyos peldaños no crecen no es una escalera. Compárese con
     Reliquia —Hallazgo, Pieza, Colección, Sala, Legado— o con Arboleda, donde
     cada nombre solo se le puede ocurrir al anterior.

     El segundo es que eran MARCAS SOBRE UN PAPEL, y un rango es lo que la
     persona ES. De un oficio sí se puede decir «soy», y esa es toda la
     diferencia entre esta lista y la de antes.

     Y los dos últimos cambiaron OTRA VEZ, y por dos razones que Eduardo vio
     antes que nadie. La primera: «Maestro de obra» y «Arquitecto» TIENEN
     GÉNERO, y la app no pregunta el tuyo a propósito — así que a la mitad de
     la gente le decía el nombre equivocado en la frase «Ahora eres X», que es
     la celebración más grande que tiene la app. La segunda: «arquitecto» es
     además un título con cédula, y decírselo a un ingeniero civil es meterse
     en un pleito de gremios que a Norata no le toca.

     El límite que salió de buscar sustitutos, y conviene saberlo antes de
     proponer otro: **el español genera con género casi todos los nombres de
     oficio.** Las únicas familias que no lo llevan son `-ista`, `-ante/-ente`,
     `-e` y `-az`, y esas terminaciones se concentran en el vocabulario
     técnico. Los tres primeros caen ahí por suerte y además son palabras
     cálidas; para la cima de un oficio de la construcción NO EXISTE una
     palabra española que sea a la vez cálida, cotidiana y sin género. Por eso
     la cima dejó de ser un puesto.

     Y los dibujos son INSTRUMENTOS y no personas, que es la parte que hay que
     entender antes de tocarlos: cinco figuras humanas no se distinguen a 20 px
     —que es el tamaño al que se pintan—, mientras que un lápiz, una escuadra,
     un compás, un casco y un hilo guía se leen de un vistazo y además escalan
     solos: se te da el lápiz, luego la regla, luego decides tú, luego
     respondes por la obra entera, y al final eres la línea con la que se
     alinean los demás. */
  { id: "plano", nombre: "Blueprint", listo: true, pro: true, icon: "map",
    premisa: "El papel de plano: retícula de dos pesos, cotas con puntas de flecha y marcas de sección. Todo lo tuyo, todavía en obra.",
    rangos: [
      /* El lápiz: lo primero que te dan y lo único que sabes usar. */
      { nombre: "Aprendiz", trazo: '<path d="M5 19l.9-3.7L16.4 4.8a2 2 0 012.8 2.8L8.7 18.1z"/><path d="M14.2 7l2.8 2.8"/>' },
      /* La escuadra, con su hueco: ya trazas derecho lo que otro pensó. */
      { nombre: "Dibujante", trazo: '<path d="M4 19.6h16.4L4 5.4z"/><path d="M7.4 16.6h8L7.4 9.4z"/>' },
      /* El compás: dejas de copiar y empiezas a decidir dónde van las cosas. */
      { nombre: "Proyectista", trazo: '<circle cx="12" cy="4.8" r="1.6"/><path d="M11.2 6.2L6.4 20M12.8 6.2L17.6 20"/><path d="M8 16.4a8.4 8.4 0 008 0"/>' },
      /* El casco: lo que te pones cuando la obra entera es asunto tuyo. */
      { nombre: "Contratista", trazo: '<path d="M2.8 17.6h18.4"/><path d="M5 17.6v-2.4a7 7 0 0114 0v2.4"/><path d="M9.8 9.4V6.4a1.6 1.6 0 011.6-1.6h1.2a1.6 1.6 0 011.6 1.6v3"/>' },
      /* El hilo tenso entre dos estacas, con su plomada colgando: en una obra
         eso ES la guía, la referencia con la que se aploma todo lo demás. Por
         eso este rango no habla de ti sino de los demás. */
      { nombre: "Guía", trazo: '<path d="M2.8 7h18.4"/><path d="M6 3.8v6.4M18 3.8v6.4"/><path d="M12 7v6.2"/><path d="M12 13.2l2.2 3-2.2 2.8-2.2-2.8z"/>' }
    ] },
  /* Reliquia es el primero construido, y va antes que Averno y Blueprint
     porque lo decidió Eduardo: es lo único que Fundador tiene además de Pro
     —`LIMITES` no tiene entrada de fundador, así que Fundador ES Pro sin
     fecha— y un pago único de $890 necesita algo que se vea.

     `listo: true` es lo que lo separa de los otros cuatro: sus nombres están
     decididos, pero sin mundo detrás no se ofrecen. `plan: "fundador"` no es
     lo mismo que `pro`: éste NO se abre pagando cada mes. */
  { id: "reliquia", nombre: "Reliquia", listo: true, plan: "fundador", icon: "gem",
    premisa: "Una pieza en su vitrina: forro de terciopelo, marco de latón y el vidrio por encima.",
    rangos: [
      { nombre: "Hallazgo", trazo: '<path d="M11 3.6l7.4 4.3v8.2L11 20.4 3.6 16.1V7.9z"/><path d="M11 3.6v16.8"/>' },
      { nombre: "Pieza",    trazo: '<path d="M12 3.4l3.1 5.1 5.7 1.3-3.9 4.5.5 5.9-5.4-2.4-5.4 2.4.5-5.9L3.2 9.8l5.7-1.3z"/>' },
      { nombre: "Colección", trazo: '<rect x="3.2" y="4.2" width="7" height="7" rx="1"/><rect x="13.8" y="4.2" width="7" height="7" rx="1"/><rect x="3.2" y="12.8" width="7" height="7" rx="1"/><rect x="13.8" y="12.8" width="7" height="7" rx="1"/>' },
      { nombre: "Sala",     trazo: '<path d="M3 20V9.6L12 4l9 5.6V20z"/><path d="M8 20v-6.4h8V20"/><path d="M3 20h18"/>' },
      { nombre: "Legado",   trazo: '<path d="M12 2.8l2.2 4.6 5 .7-3.6 3.6.9 5-4.5-2.4-4.5 2.4.9-5L4.8 8.1l5-.7z"/><path d="M8.4 15.8L7 21.2l5-2.6 5 2.6-1.4-5.4"/>' }
    ] }
];

function mundoPorId(id) {
  return MUNDOS.filter(m => m.id === id)[0] || null;
}

/* Lo que `js/02b-expedicion.js` pregunta antes de dibujar un rango. Devuelve
   null cuando la apariencia puesta es la casa o un ambiente — **un ambiente
   NUNCA renombra los rangos**: cambia la luz, no el vocabulario. */
function rangosDeApariencia() {
  const m = mundoPorId(apariencia());
  return m ? m.rangos : null;
}

function ambientePorId(id) {
  return AMBIENTES.filter((a) => a.id === id)[0] || null;
}

/* Un ambiente o un mundo, que para casi todo el motor son lo mismo: una
   apariencia. Solo se separan donde importa —un mundo renombra los rangos y un
   ambiente no, y un mundo trae su propio archivo—. Los mundos sin `listo` no
   cuentan: sus nombres están escritos porque el plan vive mejor en el código
   que en la cabeza de nadie, pero mientras no exista el mundo no se ofrece. */
function aparienciaPorId(id) {
  return ambientePorId(id) || MUNDOS.filter((m) => m.id === id && m.listo)[0] || null;
}

function esMundo(id) {
  const m = mundoPorId(id);
  return !!(m && m.listo);
}

/* ---- El archivo de los mundos, que se pide cuando hace falta ----
   `css/mundos.css` no está en `index.html` ni en `ASSETS` a propósito: lleva la
   tipografía y las texturas del mundo, y eso son decenas de kilobytes que no
   tiene por qué bajarse quien nunca va a encenderlo. Es la regla que dejó
   escrita la caché de 0.7.38.

   Se engancha una sola vez y se deja puesto: quitarlo al volver a la casa
   obligaría a bajarlo otra vez en el siguiente vistazo, y probar dos mundos
   seguidos es exactamente lo que alguien hace la primera tarde. */
let mundosPedidos = false;

function pedirLosMundos() {
  if (mundosPedidos) return;
  mundosPedidos = true;
  /* Puede venir ya enganchada desde el script de arriba de `index.html`, que la
     pide cuando lo guardado es un mundo para que no haya fogonazo. Engancharla
     dos veces no rompe nada pero la pide dos veces. */
  /* Con `^=` y no con `=`: la dirección lleva una huella detrás (`?h=…`) que
     cambia cada vez que cambia el archivo, y con la igualdad exacta este
     ancla dejaba de reconocer el `link` que ya puso el script de arriba y lo
     pedía dos veces. */
  if (document.querySelector('link[href^="css/mundos.css"]')) { pintarColorDeBarra(); return; }
  const l = document.createElement("link");
  l.rel = "stylesheet";
  /* La HUELLA del contenido va en la dirección, y la pone `mundos/app.py` al
     generar el archivo. Sin ella, un aparato podía quedarse con una copia
     vieja PARA SIEMPRE: este archivo no está en ASSETS —pesa lo que pesa un
     mundo—, así que no lo renueva la instalación; se pide suelto y lo que
     llegue se guarda en la caché de esa versión, y a partir de ahí ya es un
     acierto. Con GitHub Pages tardando un minuto en publicar, hay una ventana
     en la que `sw.js` ya es el nuevo y esto todavía es lo viejo: quien abra
     ahí se queda el archivo viejo con el número de versión nuevo puesto.
     Reproducido, y es lo que pasó con la 0.7.55.3. Cambiando la dirección,
     una copia vieja ni siquiera es la misma cosa. */
  l.href = "css/mundos.css?h=28e3f8e4db";
  /* La franja del navegador, otra vez, cuando el archivo ya está. Se pinta
     leyendo `--bg`, y hasta que este `link` carga `--bg` sigue siendo el de la
     casa: sin esto, un mundo se quedaba con la ceja azul de la casa encima.
     Medido con Reliquia: la etiqueta decía #10151d y su fondo es #100c1a. */
  l.addEventListener("load", () => pintarColorDeBarra());
  document.head.appendChild(l);
}

/* ---- Qué apariencia está puesta ---- */

function apariencia() {
  const raiz = document.documentElement;
  return raiz.getAttribute("data-apariencia") || "casa";
}

/* Lo que se guardó, que no siempre es lo que se ve: una apariencia de prueba
   vive en `sessionStorage` y desaparece al cerrar la pestaña. */
function aparienciaGuardada() {
  try { return localStorage.getItem(APARIENCIA_LLAVE) || "casa"; } catch (e) { return "casa"; }
}

/* ---- Quién puede usar qué ----
   Devuelve `true`, o el motivo por el que todavía no. Dos puertas y en este
   orden: primero el NIVEL, que es lo que se gana, y después el PLAN, que es
   lo que se paga. El orden importa para lo que se le dice a la persona — a
   quien todavía no llega al nivel no se le ofrece pagar, se le dice cuánto
   le falta. Cobrar por saltarse la escalera es justo lo que rompería la
   escalera. */
function aparienciaDisponible(id) {
  const a = aparienciaPorId(id);
  if (!a) return "no existe";
  /* Un mundo de fundador NO se abre pagando cada mes, y ésa es toda la
     diferencia que se compra. Va antes que la pregunta del nivel porque no hay
     nivel que lo abra: no es una escalera, es una compra. */
  if (a.plan === "fundador") {
    const p = typeof PLAN !== "undefined" && PLAN ? PLAN.plan : "";
    return p === "fundador" ? true : "fundador";
  }
  /* El nivel sale de `js/02b-expedicion.js`, que es el motor de la casa. Este
     archivo NO cuenta puntos: hubo un momento en que existieron dos motores a
     la vez —uno aquí y otro allá— y los dos declaraban `EXP_PUNTOS` en el
     ámbito global, que es un SyntaxError y la app entera dejaba de arrancar.
     Un solo motor, y las apariencias solo le preguntan. */
  if (a.abre && typeof nivelExpedicion === "function") {
    if (nivelExpedicion().nivel < a.abre) return "nivel";
  }
  if (a.pro && typeof planPermite === "function" && !planPermite("apariencia")) return "pro";
  return true;
}

/* ---- Ponérsela ---- */

function ponerApariencia(cual, opciones) {
  const op = opciones || {};
  const a = aparienciaPorId(cual) ? cual : "casa";
  const raiz = document.documentElement;
  if (a !== "casa" && aparienciaDisponible(a) !== true && !op.forzar) return false;
  /* El archivo del mundo, antes de poner el atributo. Si llegara después se
     vería un parpadeo con el mundo a medias: los colores puestos y la letra y
     la textura todavía en camino. */
  if (esMundo(a)) pedirLosMundos();

  /* Un instante sin transiciones, y por el mismo motivo exacto que
     `ponerTema`: en esta app una transición sobre una propiedad cuyo valor
     sale de una variable se queda CONGELADA —Chrome no se entera del cambio y
     deja el color clavado en el primero que vio, para siempre—. Cambiar de
     apariencia cambia veinte variables de golpe, así que es el mismo caso que
     el modo claro pero más grande.
     Se apagan, se cambia, se fuerza el recálculo leyendo un estilo, y se
     devuelven en el siguiente turno con un temporizador. Con
     `requestAnimationFrame` no vale: en una pestaña en segundo plano el
     navegador no dibuja cuadros, así que ese aviso no llega nunca y la app se
     quedaría SIN transiciones para siempre. */
  raiz.classList.add("cambiando-modo");
  if (a === "casa") raiz.removeAttribute("data-apariencia");
  else raiz.setAttribute("data-apariencia", a);
  getComputedStyle(raiz).backgroundColor;   // obliga a recalcular ya, no luego
  setTimeout(() => raiz.classList.remove("cambiando-modo"), 0);

  if (!op.soloVista) {
    try { localStorage.setItem(APARIENCIA_LLAVE, a); } catch (e) {}
  }
  pintarColorDeBarra();
  return true;
}

/* La franja del navegador de arriba —y en Android la barra de estado de la app
   instalada— no la pinta el CSS. `ponerTema` la cambia a mano con dos colores
   escritos; aquí no se puede, porque cada apariencia tiene los suyos y serían
   catorce parejas que mantener a mano. Se LEE el fondo ya calculado, que
   siempre dice la verdad aunque mañana entre un mundo nuevo. */
function pintarColorDeBarra() {
  const viejo = document.querySelector('meta[name="theme-color"]');
  if (!viejo) return;

  /* El color se lee del fondo YA CALCULADO y no de la variable en crudo: una
     apariencia puede declarar su página como degradado, y un degradado no vale
     para esta etiqueta. Antes se leía `--bg` y se abandonaba si traía un
     paréntesis, y abandonar quería decir dejar puesto el color de otra cosa. */
  const raiz = document.documentElement;
  let color = getComputedStyle(raiz).getPropertyValue("--bg").trim();
  if (!color || color.indexOf("(") !== -1) {
    const c = getComputedStyle(document.body || raiz).backgroundColor;
    if (c && !/rgba\(0, 0, 0, 0\)/.test(c)) color = c;
  }
  if (!color || color.indexOf("(") !== -1) return;

  /* Y se REEMPLAZA la etiqueta en vez de cambiarle el atributo. Parece lo
     mismo y no lo es: Chrome en Android elige el color de los iconos del
     sistema —la hora, la señal, la batería— al leer esta etiqueta, y cambiando
     solo el `content` hay versiones que repintan el fondo de la barra y NO
     vuelven a elegir el color de los iconos. Resultado: iconos claros sobre una
     barra que acaba de ponerse clara, o sea una barra ilegible, que es
     exactamente lo que Eduardo veía al pasar la app a modo día. Quitar y poner
     el elemento la obliga a decidir otra vez. */
  if (viejo.getAttribute("content") === color) return;
  const nuevo = document.createElement("meta");
  nuevo.setAttribute("name", "theme-color");
  nuevo.setAttribute("content", color);
  viejo.parentNode.replaceChild(nuevo, viejo);
}

/* ---- La prueba con enlace ----
   Como los tonos del modo claro en 0.7.3.1: se sube apagada y se enciende con
   una dirección. En `sessionStorage` y no en `localStorage` a propósito, para
   que no se quede pegada como si fuera un ajuste; con la pestaña cerrada
   desaparece. El rótulo fijo es parte de la receta: sin él es fácil olvidar
   que la pestaña está en modo prueba y acabar juzgando la app de verdad por
   lo que se ve ahí. */
function aparienciaDePrueba() {
  let cual = null;
  try { cual = sessionStorage.getItem(APARIENCIA_PRUEBA); } catch (e) {}
  if (!cual) return null;
  if (!aparienciaPorId(cual)) return null;
  return cual;
}

function rotuloDePrueba(cual) {
  if (document.getElementById("aparienciaPrueba")) return;
  const n = aparienciaPorId(cual);
  const d = document.createElement("div");
  d.id = "aparienciaPrueba";
  d.textContent = "Apariencia de prueba: " + (n ? n.nombre : cual);
  document.body.appendChild(d);
}

/* ---- El arranque ----
   Lo llama `js/11-arranque.js`. El atributo ya lo puso el script de arriba de
   `index.html` antes de pintar; esto es lo que hace falta después: el rótulo,
   el color de la barra, y quitar una apariencia que se guardó cuando se podía
   y ahora ya no —alguien que dejó de pagar con Escarcha puesta—. */
function arrancarApariencia() {
  const prueba = aparienciaDePrueba();
  if (prueba) {
    ponerApariencia(prueba, { soloVista: true, forzar: true });
    rotuloDePrueba(prueba);
    pintarColorDeBarra();
    return;
  }
  const puesta = apariencia();
  /* Si lo guardado es un mundo, su archivo hace falta ANTES de nada: el
     atributo ya lo puso el script de arriba de `index.html` para que no haya
     fogonazo, así que sin esto la app arrancaría con el atributo puesto y sin
     ninguna regla que lo lea — o sea, con la casa pintada y el nombre de otro. */
  if (esMundo(puesta)) pedirLosMundos();
  /* AQUÍ NO SE QUITA NADA, y esto costó un fallo que Eduardo vio en su
     teléfono: «no cambia el tema y quita el recolor».

     Antes se preguntaba aquí si la apariencia guardada seguía estando
     permitida, y se quitaba si no. El problema es CUÁNDO corre esto: al
     arrancar, antes de que el servidor haya contestado quién eres. En ese
     instante tu nivel es 0 y tu plan es el libre, así que la puerta decía que
     no y la apariencia se caía — y no había segunda mirada. Medido: con
     `norata-apariencia = duna` guardado, el atributo salía en null y seguía en
     null aunque después el nivel llegara a 50.

     Ahora se pinta lo guardado y la puerta se revisa en `refrescarApariencia()`,
     cuando el servidor ya contestó. */
  pintarColorDeBarra();
}

/* Volver a mirar si la apariencia puesta sigue permitida. La llaman
   `revisarAdmin` cuando el servidor contesta y los dos sitios que mueven el
   plan, que es exactamente cuando la respuesta puede cambiar.

   Congelar, nunca quitar: si ya no se puede, se vuelve a la casa en vez de
   dejar la app pintada con algo que el servidor no reconoce, pero la elección
   guardada NO se borra — el día que vuelva a pagar, vuelve su apariencia. */
function refrescarApariencia() {
  const puesta = apariencia();
  const raiz = document.documentElement;
  const puedo = puesta === "casa" || aparienciaDisponible(puesta) === true;
  const ahora = raiz.getAttribute("data-apariencia") || "casa";
  const debe = puedo ? puesta : "casa";
  if (ahora === debe) return;

  if (debe !== "casa" && esMundo(debe)) pedirLosMundos();
  raiz.classList.add("cambiando-modo");
  if (debe === "casa") raiz.removeAttribute("data-apariencia");
  else raiz.setAttribute("data-apariencia", debe);
  getComputedStyle(raiz).backgroundColor;
  setTimeout(() => raiz.classList.remove("cambiando-modo"), 0);
  pintarColorDeBarra();
}

/* ================= La pantalla de Apariencia =================
   Vive DENTRO de Ajustes y no en una pantalla nueva ni en una pestaña de la
   barra: una tienda con su propio botón abajo es un mostrador en la recámara.
   Y la app ya tenía el sitio natural — el interruptor de sol y luna vive en el
   índice de Ajustes, y elegir ambiente es la misma familia de decisión. El sol
   y la luna NO se mueven de ahí: están dos centímetros más arriba en la misma
   pantalla, y sacarlos de su sitio para hacerle hueco a esto sería cobrarle el
   cambio a quien no viene a comprar. */

/* Desde 0.7.41 la sección es de todos: el nivel de expedición existe, así que
   un ambiente que se desbloquea ya sabe cuándo se desbloqueó y la escalera
   significa algo. Antes iba detrás de `?apariencia=` justamente porque
   enseñar cinco premios que nadie podía ganarse los regalaba. */
const APARIENCIA_PUBLICA = true;

function aparienciaVisibleEnAjustes() {
  return APARIENCIA_PUBLICA || !!aparienciaDePrueba();
}

/* Por qué no se puede, dicho como lo diría una persona. Un candado sin motivo
   al lado es una lista de lo que te falta; con el motivo es una meta. */
function motivoApariencia(a) {
  const puede = aparienciaDisponible(a.id);
  if (puede === true) return null;
  if (puede === "nivel") return "Nivel " + a.abre;
  if (puede === "fundador") return "Solo Fundador";
  if (puede === "pro" && typeof NOMBRE_PRO === "string") return "Con " + NOMBRE_PRO;
  return "Con Pro";
}

function renderPanelApariencia() {
  const caja = document.getElementById("panel-apariencia");
  if (!caja) return;
  const puesta = apariencia();

  const muestras = AMBIENTES.map((a) => {
    const bloqueado = aparienciaDisponible(a.id) !== true;
    const motivo = motivoApariencia(a);
    /* El motivo se escribe AL LADO: es lo que convierte «no lo tienes» en «lo
       tendrás», y es la mitad del premio. Los que ya tienes no llevan pie —
       decirle a alguien el nivel de algo que ya se ganó es ruido. */
    const pie = motivo || "";
    return `
      <button type="button" class="amb-m mues-${a.id}${puesta === a.id ? " on" : ""}${bloqueado ? " cerrado" : ""}"
        onclick="elegirApariencia('${a.id}')"
        aria-pressed="${puesta === a.id}"
        title="${escapeHtml(a.nombre)}${pie ? " · " + escapeHtml(pie) : ""}">
        <span class="amb-mini" aria-hidden="true">
          <span class="amb-tarj"></span><span class="amb-pt"></span>
          ${a.icon ? `<span class="amb-ic">${icon(a.icon, 15)}</span>` : ""}
        </span>
        <span class="amb-n">${escapeHtml(a.nombre)}</span>
        ${pie ? `<span class="amb-p">${escapeHtml(pie)}</span>` : ""}
      </button>`;
  }).join("");

  /* Los mundos van en su PROPIA reja y no mezclados con los ambientes, y no es
     una cuestión de orden: son cosas de distinta especie. Un ambiente le cambia
     la luz al mismo material; un mundo cambia el material —la superficie, el
     marco, la letra y el peso al moverse— y por eso declara sus propios
     colores y es excluyente con los ambientes. Mezclarlos en una lista los
     haría parecer catorce opciones del mismo tipo, que es justo la confusión
     que `apariencias/LEEME.md` existe para evitar. */
  const listos = MUNDOS.filter((m) => m.listo);
  /* La primera fila es la salida, y existe porque Eduardo preguntó lo obvio:
     con un mundo puesto, ¿cómo se vuelve? Hasta ahora había que tocar un
     RECOLOR, que es pedir una cosa para conseguir otra — se lee como «elegir
     Musgo», no como «quitar Reliquia». Ahora la puerta de vuelta está en la
     misma lista por la que se entró, que es donde uno la busca. */
  const salida = `
      <button type="button" class="mun-m mun-salida${esMundo(puesta) ? "" : " on"}"
        onclick="elegirApariencia('casa')" aria-pressed="${!esMundo(puesta)}">
        <span class="mun-ic">${icon("compass", 20)}</span>
        <span class="mun-tx">
          <b>Norata clásico</b>
          <span>Sin mundo: el material de siempre, con el ambiente que lleves puesto.</span>
        </span>
      </button>`;
  const mundos = salida + listos.map((m) => {
    const bloqueado = aparienciaDisponible(m.id) !== true;
    const pie = motivoApariencia(m) || "";
    return `
      <button type="button" class="mun-m mues-${m.id}${puesta === m.id ? " on" : ""}${bloqueado ? " cerrado" : ""}"
        onclick="elegirApariencia('${m.id}')"
        aria-pressed="${puesta === m.id}"
        title="${escapeHtml(m.nombre)}${pie ? " · " + escapeHtml(pie) : ""}">
        ${m.icon ? `<span class="mun-ic">${icon(m.icon, 20)}</span>` : ""}
        <span class="mun-tx">
          <b>${escapeHtml(m.nombre)}</b>
          <span>${escapeHtml(m.premisa || "")}</span>
        </span>
        ${pie ? `<span class="mun-p">${escapeHtml(pie)}</span>` : ""}
      </button>`;
  }).join("");

  caja.innerHTML = `
    <h3>Ambientes</h3>
    <p class="settings-note">El mismo Norata con otra luz. Se van desbloqueando conforme avanzas, y el modo de día y de noche sigue arriba: cada ambiente tiene sus dos caras.</p>
    <div class="amb-rej">${muestras}</div>
    ${listos.length ? `<h3 class="amb-h2">Mundos</h3>
    <p class="settings-note">Un mundo no es otra luz: es otro material. Cambia la superficie, el marco, la letra y hasta cómo se llama tu camino. Van aparte de los ambientes porque no se combinan — llevas uno o llevas el otro.</p>
    <div class="mun-rej">${mundos}</div>` : ""}`;
}

/* Un toque: se pone, se guarda y se vuelve a dibujar la rejilla para que la
   marca de «puesta» se mueva. Si no se puede, no se pone y se dice por qué en
   vez de no hacer nada — un botón que no contesta parece roto. */
function elegirApariencia(id) {
  /* `aparienciaPorId` y no `ambientePorId`, que es lo que había y por lo que
     tocar Reliquia no hacía absolutamente nada: la lista de mundos no está en
     `AMBIENTES`, así que esto salía por el `return` de la línea siguiente sin
     un error, sin un aviso y sin cambiar nada. Se corrigieron `disponible`,
     `poner` y `motivo` al construir el mundo, y se quedó justo la función por
     la que se entra. */
  const a = aparienciaPorId(id);
  if (!a) return;
  const motivo = motivoApariencia(a);
  if (motivo) {
    if (typeof toast === "function") toast(a.nombre + " viene con " + motivo.replace(/^Con /, ""), "atencion");
    return;
  }
  if (!ponerApariencia(id)) return;
  renderPanelApariencia();

  /* Y se recarga la página. Lo pidió Eduardo y resuelve de raíz una clase
     entera de problemas: un mundo trae su propio archivo de estilos, que llega
     por la red DESPUÉS de que el atributo ya esté puesto, y el árbol de
     talentos y las escenas se dibujan una vez con los colores que había al
     dibujarlas. Aplicarlo en caliente deja media app con lo nuevo y media con
     lo viejo; recargar la deja entera, y el arranque ya sabe pintar la
     apariencia guardada antes del primer fotograma.

     Dentro del EJEMPLO no se recarga: el ejemplo vive en memoria y una recarga
     lo borraría sin avisar. Ahí se aplica en caliente, que es lo que había, y
     es el único sitio donde la mezcla se puede tolerar — lo que se está
     mirando son datos inventados. */
  if (typeof modoEjemplo !== "undefined" && modoEjemplo) return;
  /* Sin el nombre: lo pidió Eduardo y tiene razón — el nombre ya está en la
     tarjeta que acabas de tocar, y repetirlo en el aviso es decir dos veces lo
     mismo medio segundo antes de que la app se recargue y lo enseñe. */
  if (typeof toast === "function") toast("Cambiando tema…", "calma");
  /* Un respiro para que el aviso se vea y para que `localStorage` haya
     escrito de verdad antes de irse. */
  setTimeout(() => location.reload(), 420);
}

/* Desde la tarjeta del Resumen: lleva a Ajustes con la sección ya abierta. Es
   el único camino corto que hay a lo que se acaba de desbloquear, y sin él la
   tarjeta anuncia un premio sin decir dónde se recoge. */
function abrirApariencia() {
  if (typeof showView === "function") showView("settings");
  if (typeof ajusteAbierto !== "undefined") ajusteAbierto = "aspecto";
  if (typeof renderAjustes === "function") renderAjustes();
}
