configurarBoton('cambiarColores', funCambiarColores, []);
configurarBoton('button15', funPromediarDatos, ["Promedio 15 min.", 15]);
configurarBoton('button60', funPromediarDatos, ["Promedio 60 min.", 60]);
configurarBoton('button1D', funPromediarDatos, ["Promedio diario", 60*24]);
configurarBoton('buttonNoc', funPromediarDatos, ["Promedio nocturno",60*24,0,true]);
configurarBoton('buttonDesfase1D', funPromediarDatos, ["Promedio 60 min, dia anterior", 60,-24*60]);
configurarBoton('ejeY', funSetearEjesY, []);
configurarBoton('CSV', funDownload, ["CSV"]);
configurarBoton('XLS', funDownload, ["XLS"]);

function configurarBoton(elementId, funcion, argumentos){
	document.getElementById(elementId).onclick = () => {
		chrome.tabs.query(
			{active:true, currentWindow:true},
			(tabs) => {
				chrome.scripting.executeScript({
					target: {tabId: tabs[0].id},
					func: funcion,
					args : argumentos,
					world: 'MAIN'
				});
			});	
	};	
}

function funDownload(fileformat){
	var chart = Highcharts.charts.slice(-1)[0];
	if(fileformat === "CSV"){chart.downloadCSV(); return};
	if(fileformat === "XLS"){chart.downloadXLS(); return};
}


function funSetearEjesY(){
	var chart = Highcharts.charts.slice(-1)[0];
	for( let i = 0; i < chart.yAxis.length; i++ ){
		chart.yAxis[i].setExtremes(0);
	}
}

function funCambiarColores() {
	console.log("funCambiarColores");
	var newColors = ["#FF6B6B","#FFFF00","#0082C8","#F58230","#FF0000","#46F0F0","#F032E6","#D2F53C","#FABEBE","#3CB44B",
				 "#008080","#E6BEFF","#AA6E28","#FFFAC8","#800000","#AAFFC3","#808000","#FFD7B4","#000080","#AAAAAA","#FFFFFF","#000000"];

	var chart = Highcharts.charts.slice(-1)[0];
	chart.series.forEach((series, i) => {
		series.update({
			color: newColors[i % newColors.length],
		});
	});
};

function funPromediarDatos(title, deltaT, desfase=0, nocturno=false) {
    //deltaT en minutos = ventana de tiempo en que se calcula el promedio
    //desfase en minutos = tiempo que se le suma a X para representar en grafico. Se usa para comparar series de tiempos anteriores. p.ej. desfase = -24*60 compara con datos del dia anterior.
    //nocturno true/false = si es verdadero se hace el promedio de datos solo entre las 1:00 y 4:59:59. Para calcular el tipico promedio nocturno, ingresar con deltaT = 24*60
	
    desfase = desfase * 60000; // desfase entra en minutos y hay que convertirlo a milisegundos
 
    var chart = Highcharts.charts.slice(-1)[0];
	
	// Eliminar la serie si ya existe en el chart y finalizar
	for(let i = 0; i < chart.series.length; i++){
		if(chart.series[i].name === title){
			chart.series[i].remove();
			return "Eliminado " + title;
		}
	}
	
    // Obtener la serie de datos	
    var seriesDataX = chart.series[0].processedXData.slice();
    var seriesDataY = chart.series[0].processedYData.slice();

    // Preprocesamiento en caso de nocturno=true
    // Calcular la hora (numero entero entre 0 y 23)
    // si la hora no es nocturna, reemplazar valor de Y por null
    if(nocturno){
        var t0 = 1262314800000; // 2010-01-01 00:00:00
        var horas = seriesDataX.map((x) => Math.floor((x - t0)/1000/60/60 + 3) % 24);
        for( let i = 0; i < seriesDataX.length; i++){
            if(horas[i]<2 || horas[i]>5){
                seriesDataY[i] = null;
            }
        }
    }

	// Calcular el promedio de Y cada deltaT minutos.
    // el desfase se aplica al insertar el punto en la serie nueva (newData.push...)
	var newData = [];
	var interval = deltaT * 60 * 1000; // deltaT en milisegundos
	var lastIntervalStart = Math.floor(seriesDataX[0] / interval) * interval;
	var sum = 0;
	var count = 0;
    var yAvg = 0;
	for (let i = 0; i < seriesDataX.length; i++) {
        var pointx = seriesDataX[i];
        var pointy = seriesDataY[i];
        var intervalStart = Math.floor(pointx / interval) * interval;
        if (intervalStart != lastIntervalStart) {
            if(count == 0){
                yAvg = null;
            }
            else{
                yAvg = sum/count;
            }
            newData.push([lastIntervalStart + interval / 2 - desfase , yAvg]);
            sum = 0;
            count = 0;
            lastIntervalStart = intervalStart;
        }
        if(pointy !== null){
            sum += pointy;
            count++;
        }
	}

    // recortar newData. Cuando hay desfase, no mostrar datos mas alla del final de la serie original.
    newData = newData.filter((x) => x[0]<=seriesDataX.slice(-1));

    // Agregar la serie al objeto chart
	chart.addSeries({
		name: title,
		data: newData
	});
	return "Agregado " + title;
};
