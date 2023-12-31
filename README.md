# HighchartsMod
## [Link a Chromestore](https://chromewebstore.google.com/detail/highcharts-mod/goembobhgepgohgankgehmboojdaicdo)
Una extensión de navegador que añade un popup con botones que permiten modificar gráficos construidos con Highcharts.

## Instalación

### Chrome/Edge
1. Instalar de [aquí](https://chromewebstore.google.com/detail/highcharts-mod/goembobhgepgohgankgehmboojdaicdo).

### Chrome/Edge (instalación manual)
1. Descargar la extensión en zip y descopmrimirlo en alguna carpeta de tu computador. O bien, descargar los archivos de la carpeta src de este repositorio.
2. Abrir el administrador de extensiones en Chrome/Edge.
3. Habilitar Modo de Desarrollador.
4. Click en "Cargar descomprimida" o "desempaquetada"
5. Seleccionar la carpeta donde esten los archivos del paso 1.
6. Listo.

## Uso
1. Abrir un sitio donde se muestre algún gráfico de series de tiempo.
2. Hacer clic en el ícono de la extensión. Se despliega el popup.
3. Usar alguno de los botones de la extensión:
   1. [Color]: Cambia los colores de la serie según una lista de colores predeterminada.
   2. [Eje]: Setea todos los ejes Y del gráfico para que partan en cero.
   3. [<], [24H], [>]: Permite mover la ventana de tiempo 50% atras, a las ultimas 24 horas y 50% adelante, respectivamente.
   4. [OFF], [ON]: Permite apagar y encender todas las leyendas del grafico.
   5. [15], [60], [1D]: Crea una nueva serie de promedios cada 15 minutos, 60 minutos y 1 día respectivamente.
   6. [Noc]: Calcula el promedio de datos entre las 02:00 y 05:00 (hora utc -3). Se asume que los datos vienen en UTC.
   7. [-1D], [-7D]: Muestra lo mismo que [60] pero del día o semana anterior. Útil para comparar la serie actual con la de ayer o semana pasada.
   8. [Suma]: Calcula la suma de todas las series visibles en el grafico. Esto, siempre y cuando todas las series visibles compartan el mismo eje Y y compartan la granularidad.
   9. [CSV], [XLS]: Exporta los datos mostrados en el gráfico. La descarga no incluye leyendas apagadas.