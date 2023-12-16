configurarBoton('cambiarColores', funCambiarColores, []);
configurarBoton('button15', funPromediarDatos, ["Prom. 15 min.", 15]);
configurarBoton('button60', funPromediarDatos, ["Prom. 60 min.", 60]);
configurarBoton('button1D', funPromediarDatos, ["Prom. diario", 60*24]);
configurarBoton('buttonNoc', funPromediarDatos, ["Prom. nocturno",60*24,0,true]);
configurarBoton('buttonDesfase1D', funPromediarDatos, ["Dia anterior", 60,-24*60]);
configurarBoton('buttonDesfase7D', funPromediarDatos, ["Semana anterior", 60,-24*60*7]);
configurarBoton('ejeY', funSetearEjesY, []);
configurarBoton('CSV', downloadChartData, ["CSV"]);
configurarBoton('XLS', downloadChartData, ["XLS"]);
configurarBoton('buttonOFF', toggleAllSeriesVisibility, ["OFF"]);
configurarBoton('buttonON', toggleAllSeriesVisibility, ["ON"]);
configurarBoton('button24h', timeSetup, []);
configurarBoton('buttonMenosT', timeSetup, [false, -1]);
configurarBoton('buttonMasT', timeSetup, [false, 1]);

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

function downloadChartData(fileformat){
	var chart = Highcharts.charts.slice(-1)[0];
	if(fileformat === "CSV"){chart.downloadCSV(); return};
	if(fileformat === "XLS"){chart.downloadXLS(); return};
}

function toggleAllSeriesVisibility(onoff){
	var chart = Highcharts.charts.slice(-1)[0];
	for(let i = 0; i < chart.series.length; i++){
		chart.series[i].setVisible(onoff == "ON", false);
	};		
	chart.redraw();	
}

function funSetearEjesY(){
	var chart = Highcharts.charts.slice(-1)[0];
	chart.yAxis.forEach( (axis) => { axis.update({min : 0}, false)} );
	chart.yAxis.forEach( (axis) => { axis.update({tickAmount : 13}, false)} );
	
	//Agregar crosshairs
	chart.xAxis[0].update({crosshair : {color:"#999999", width:1, snap:false} }, false);
	chart.yAxis[0].update({crosshair : {color:"#999999", width:1, snap:false} }, false);
	
	chart.redraw();
}

function funCambiarColores() {
	console.log("funCambiarColores");
	var newColors = ["#FF6B6B","#FFFF00","#0082C8","#F58230","#FF0000","#46F0F0","#F032E6","#D2F59C","#BABEBE","#3CB44B",
				 "#008080","#E6BEFF","#AA6E28","#FFFAC8","#800000","#AAFFC3","#808000","#FFD7B4","#000080","#FFFFFF","#000000"];

	var chart = Highcharts.charts.slice(-1)[0];
	
	//Ver si los colores son iguales a newColors.
	alreadyChangedColors = chart.series.map((series, i) => {
		return series.color == newColors[i % newColors.length];
	});	
	
	// si son iguales a newColors, revolverlos.
	let shuffleArray = function (array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }};
	if(alreadyChangedColors.every(Boolean)){shuffleArray(newColors);};

	// Cambiar colores
	chart.series.forEach((series, i) => {
		series.update( 
			{ color: newColors[i % newColors.length] },
			false
		);
	});
	chart.redraw();	
};

function funPromediarDatos(title, deltaT, desfase=0, nocturno=false, seriesIndex = undefined) {
    //deltaT en minutos = ventana de tiempo en que se calcula el promedio
    //desfase en minutos = tiempo que se le suma a X para representar en grafico. Se usa para comparar series de tiempos anteriores. p.ej. desfase = -24*60 compara con datos del dia anterior.
    //nocturno true/false = si es verdadero se hace el promedio de datos solo entre las 1:00 y 4:59:59. Para calcular el tipico promedio nocturno, ingresar con deltaT = 24*60
	
    desfase = desfase * 60000; // desfase entra en minutos y hay que convertirlo a milisegundos
	
    var chart = Highcharts.charts.slice(-1)[0];
	
	// buscar primera serie con leyenda encendida si no se especifica cual
	if(!seriesIndex){	
		for(let i = 0; i < chart.series.length; i++){
			if(chart.series[i].visible){
				seriesIndex = i;
				break;
			}
		};	
	};
	var serie = chart.series[seriesIndex];	
	title = title + "(" + serie.name + ")";
	
	// Eliminar la serie si ya existe en el chart y finalizar
	for(let i = 0; i < chart.series.length; i++){
		if(chart.series[i].name === title){
			chart.series[i].remove();
			return "Eliminado " + title;
		}
	}
	
    // Obtener la serie de datos	
    var seriesDataX = serie.processedXData.slice();
    var seriesDataY = serie.processedYData.slice();

	//Preprocesamiento: cuando se selecciona una fecha final mayor a la fecha actual hay borrar la corrida de nulls del final
	let lastIndex = seriesDataY.length - 1;	  
	while (lastIndex >= 0 && seriesDataY[lastIndex] === null) {
		seriesDataY.pop();
		seriesDataX.pop();
		lastIndex--;
	};

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

    // Agregar la serie al objeto chart (en el eje Y correspondiente)
	chart.addSeries({
		name: title,
		data: newData,
		yAxis : serie.yAxis.userOptions.index
	});	
	return "Agregado " + title;
};

function timeSetup(defaultRefresh = true, sign = 1) {  
	//defaultRefresh = permiten mostrar las ultimas 24 horas.
	//sign = 1 para ir hacia adelante, -1 hacia atras
	//si defaultRefresh = false, se movera la ventana en 50% segun sign
	
	// funcion auxiliar para sumar segundos a un Date
	let addSecondsToDate = (inputDate, secondsToAdd) => {
	  const newDate = new Date(inputDate); 
	  newDate.setTime(newDate.getTime() + secondsToAdd); 
	  return newDate;
	};

	if (defaultRefresh){
		// Calcular timestamps inicial y final tal que el rango corresponda a las ultimas 24 horas
		var now = new Date();
		var startDate = addSecondsToDate(now, -24*60*60*1000);
		var endDate = addSecondsToDate(startDate, 24*60*60*1000);
	}
	else{		
		// funcion para parsear dd/mm/yyyy h:mm:ss
		let datestrToDate = (datestr) => { 
			var dateParser = /(\d{2})\/(\d{2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})/;
			var match = datestr.match(dateParser);
			var outputDate = new Date(
				match[3],    // year
				match[2]-1,  // monthIndex
				match[1],    // day
				match[4],    // hours
				match[5],    // minutes
				match[6]     //seconds
			);
			return outputDate;
		};
		
		//Movere la ventana de tiempo en un 50%
		let dateRange = document.querySelector('input[name="daterange"]').value.split(" - ")
		let dateRange_start = datestrToDate(dateRange[0]);
		let dateRange_end = datestrToDate(dateRange[1]);
		let dif = Math.abs(dateRange_end - dateRange_start) / 2;
		var startDate = addSecondsToDate(dateRange_start, sign * dif);	
		var endDate = addSecondsToDate(dateRange_end, sign * dif);		
	};

	// formato DD/MM/YYYY HH:MM:SS
	var startDate_str = startDate.toLocaleString('es-ES');
	var endDate_str = endDate.toLocaleString('es-ES');
	
	var dateRangeInput = document.querySelector('input[name="daterange"]');
	dateRangeInput.value = startDate_str + ' - ' + endDate_str; // Set the date range value

	// Create and dispatch a keyup event (simulating 'Enter' key)
	var keyupEvent = new KeyboardEvent('keyup', {
		bubbles: true,
		cancelable: true,
		key: 'Enter', // Simulate the 'Enter' key press
	});
	dateRangeInput.dispatchEvent(keyupEvent); // Dispatch the keyup event
	document.querySelector('button[title="Refrescar datos"]').click(); //Click Refrescar datos
};
