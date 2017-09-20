function addInstance (obj, myArray){
	var instanceName = obj.instance;
	var found = false;
	for (var i=0; i < myArray.length; i++) {
	    if (myArray[i].insertDate === obj.insertDate && !myArray[i][instanceName]) {
	        myArray[i][instanceName] = obj.mid;
	        found = true;
	        break;
	    }
	}
	if (!found) {
		var nObj = {};
		nObj[instanceName] = obj.mid;
		nObj.insertDate = obj.insertDate;
		myArray.push(nObj);
	}

}
var charts = 0;
console.log(async);

window.onload = function () {
	(function callAjax(url, callback){
	    var xmlhttp;
	    xmlhttp = new XMLHttpRequest();
	    xmlhttp.onreadystatechange = function(){
	        if (xmlhttp.readyState == 4 && xmlhttp.status == 200){
	            callback(xmlhttp.responseText);
	        }
	    }
	    xmlhttp.open("GET", url, true);
	    xmlhttp.send();
	})('/data', function (rows) {
		var data = JSON.parse(rows).records;
		var groups = {};
		var machines = {};
		var charts = [];
		var container = document.getElementById('container');	
		for (var i = data.length - 1; i >= 0; i--) {
			var owner = (data[i].owner === 'salchipapa.llameante') ? 'salchipapa_llameante' : data[i].owner;
			var instanceName = data[i].instance;
			groups[owner] = groups[owner] || [];
			if (groups[owner].length === 0) {
				var obj = {};
				obj[instanceName] = data[i].mid;
				obj.insertDate = data[i].insertDate;	
				groups[owner].push(obj);
			} else {
				addInstance(data[i], groups[owner]);
			}	
			machines[owner] = machines[owner] || [];
			if (machines[owner].indexOf(data[i].instance) === -1) 
				machines[owner].push(data[i].instance)
		}
		var tA = Date.now();

		async.eachOfSeries(groups, function (item, owner, cb) {
			var wrapper = document.createElement('DIV');
			wrapper.className = 'chartWrapper';
			var title = document.createElement('H3');
			var div = document.createElement('DIV');
			div.id = owner;
			div.className = 'ownerChart';
			title.textContent = owner;
			title.className = 'ownerTitle';
			wrapper.append(title);
			wrapper.appendChild(div);
			container.appendChild(wrapper);
			c3.generate({
				bindto: '#' + owner,
				data: {
				 	x: 'insertDate',
				 	json: groups[owner],
					keys: {
				    x: 'insertDate',
				    value: machines[owner]
				},
				axes: {
				    'mid': 'y'
				     //mid: 'y2'
					}
				},
				padding: {
				        right: 20,
				    },
				grid: {
					x: {
					    show: true
					},
					y: {
						lines: [{value: 400}]
					}
				},
				oninit: function () {
				    //console.log(charts, Object.keys(groups).length);
				    //charts++;
				    console.log('next')
				    setTimeout(function () {
				    	cb();
				    }, 0)
				    //if (Object.keys(groups).length - 1 === charts) {
					//	document.getElementById("cover").remove();
				    //}
				  },
				regions: [
				    {axis: 'y', start: 0, end: 199, class: 'verylow'},
				    {axis: 'y', start: 200, end: 299, class: 'low'},
				    {axis: 'y', start: 300, end: 399, class: 'medium'},
				    {axis: 'y', start: 400, end: 449, class: 'good'},
				    {axis: 'y', start: 450, end: 499, class: 'verygood'},
				    {axis: 'y', start: 500, class: 'excelent'},

				],
				subchart: {
				    show: true
				},
				point: {
				    show: false
				},
				axis: {
					x: {
				    	type: 'timeseries',
				    	tick: {format: '%H:%M:%S'}
				 	},
					y2: {
				 		show: false
					}
				}
			});
		}, function () {
			console.log('aa')
			document.getElementById('container').removeAttribute('hidden');
			document.getElementById("cover").remove();
		})
				//
		console.log(Date.now() - tA);
	});
}
/*
		for (owner in groups) {
			var wrapper = document.createElement('DIV');
			wrapper.className = 'chartWrapper';
			var title = document.createElement('H3');
			var div = document.createElement('DIV');
			div.id = owner;
			div.className = 'ownerChart';
			title.textContent = owner;
			title.className = 'ownerTitle';
			wrapper.append(title);
			wrapper.appendChild(div);
			container.appendChild(wrapper);
			c3.generate({
				bindto: '#' + owner,
				data: {
				 	x: 'insertDate',
				 	json: groups[owner],
					keys: {
				    x: 'insertDate',
				    value: machines[owner]
				},
				axes: {
				    'mid': 'y'
				     //mid: 'y2'
					}
				},
				padding: {
				        right: 20,
				    },
				grid: {
					x: {
					    show: true
					},
					y: {
						lines: [{value: 400}]
					}
				},
				oninit: function () {
				    console.log(charts, Object.keys(groups).length);
				    charts++;
				    
				    if (Object.keys(groups).length - 1 === charts) {
						document.getElementById("cover").remove();
				    }
				  },
				regions: [
				    {axis: 'y', start: 0, end: 199, class: 'verylow'},
				    {axis: 'y', start: 200, end: 299, class: 'low'},
				    {axis: 'y', start: 300, end: 399, class: 'medium'},
				    {axis: 'y', start: 400, end: 449, class: 'good'},
				    {axis: 'y', start: 450, end: 499, class: 'verygood'},
				    {axis: 'y', start: 500, class: 'excelent'},

				],
				subchart: {
				    show: true
				},
				point: {
				    show: false
				},
				axis: {
					x: {
				    	type: 'timeseries',
				    	tick: {format: '%H:%M:%S'}
				 	},
					y2: {
				 		show: false
					}
				}
			});
		}
		//document.getElementById("cover").remove();
		console.log(Date.now() - tA);
	});
	*/