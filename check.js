var socket = io({transports: ['websocket']});

function callAjax (url, callback) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function(){
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200){
            callback(xmlhttp.responseText);
        }
    }
    xmlhttp.open("POST", url, true);
    xmlhttp.send();
}

function addOwner () {
	if (confirm('¿Tienes el código de autentificación?. Si no lo lo tienes dale a cancelar y se abrirá una pestaña, logueate y copia el código')) {
		if (confirm('Me comprometo a no cagarla. El propietario NO puede contener GUIONES O PUNTOS ni ser una cuenta de hotmail')) {
			if (confirm('¿Seguro?. Se donde vives')) {
				var promptCodigo = prompt("Introduce el código generado");
				var promptPropietario = prompt("Introduce el nombre del propietario, es decir, la parte del correo hasta la @. Ej: culo@gmail.com -> culo");
				if (!promptPropietario || promptPropietario === '' || promptPropietario.indexOf('@') !== -1 || promptCodigo === '' || !promptCodigo || promptPropietario.indexOf('-') !== -1 || promptPropietario.indexOf('.') !== -1) {
					window.alert('Propietario o código invalido');
				} else {
					window.alert('allé voy');
					callAjax('/owners/' + promptPropietario + '/' + promptCodigo.replace('/', '$'), function (data) {
						data = JSON.parse(data);
						if (!data.err) {
							window.alert('Propietario añadido correctamente!');
						} else {
							window.alert('La cagaste, enseñale esto a big poppa: ' + JSON.stringify(data.err));
						}
					});
				}
			}
		}
	} else {
		window.open("https://accounts.google.com/o/oauth2/auth?redirect_uri=urn%3Aietf%3Awg%3Aoauth%3A2.0%3Aoob&prompt=select_account&response_type=code&client_id=32555940559.apps.googleusercontent.com&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcloud-platform+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fappengine.admin+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcompute+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Faccounts.reauth&access_type=offline");
	}

	//var conf = confirm('Me comprometo a no cagarla. El propietario NO puede contener GUIONES O PUNTOS ni ser una cuenta de hotmail');
	//if (conf) {
	//	var conf2 = confirm('De verdad');
	//	if (conf2) {
	//		confirm('Se va a abrir una pestaña, logueate con la cuenta y copia el codigo resultante');
	//		window.open("https://accounts.google.com/o/oauth2/auth?redirect_uri=urn%3Aietf%3Awg%3Aoauth%3A2.0%3Aoob&prompt=select_account&response_type=code&client_id=32555940559.apps.googleusercontent.com&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcloud-platform+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fappengine.admin+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcompute+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Faccounts.reauth&access_type=offline");
	//		var conf3 = confirm('¿Seguro?. Se donde vives');
	//		if (conf3) {
	//			var promptCodigo = prompt("Introduce el código generado");
	//			var promptPropietario = prompt("Introduce el nombre del propietario, ej: culo@gmail.com -> culo");
	//			if (!promptPropietario || promptPropietario === '' || promptPropietario.indexOf('@') !== -1 || promptCodigo === '' || !promptCodigo) {
	//				window.alert('Propietario invalido');
	//				return;
	//			}
	//			window.alert('allé voy');
	//			console.log('/owners/' + promptPropietario + '/' + prompCodigo);
	//			//callAjax('/owners/' + promptPropietario + '/' + prompCodigo, function (data) {
	//			//	data = JSON.parse(data);
	//			//	if (!data.err) {
	//			//		window.alert('Propietario añadido correctamente!');
	//			//	} else {
	//			//		window.alert('La cagaste: ' + data.err);
	//			//	}
	//			//});
	//		} else {
	//			window.alert('la paraste de pechito');
	//		}
	//	} else {
	//		window.alert('oleme el dedo');
	//	}
	//} else {
	//	window.alert('Go home');
	//}
}

window.onload = function () {

var timers = document.getElementsByClassName('timer');
var lists = document.getElementsByTagName("TBODY");

setInterval(function () {
	for (var i = timers.length - 1; i >= 0; i--) {
		var element = timers[i];
		var value = Number.parseInt(element.firstElementChild.textContent);
		element.firstElementChild.textContent = value + 1;
		element.lastElementChild.textContent = (value === 1) ? ' segundo' : ' segundos';
		if (value > 70) {
			timers[i].parentNode.setAttribute('restarting', true);
		} else {
			timers[i].parentNode.removeAttribute('restarting');
		}
		//console.log(timers[i].textContent.split(' ')[0]);
	}
}, 1000);

var getColor = function (value) {
	var res = '';
	if (value === 'n/a' || value === 0) {
		res = 'off';
	} else if (value < 200) {
		res = 'verylow';
	} else if (value >= 200 && value < 300) {
		res = 'low';
	} else if (value >= 300 && value < 400) {
		res = 'medium';
	} else if (value >= 400 && value < 450) {
		res = 'good';
	} else if (value >= 450 && value < 500) {
		res = 'verygood';
	} else if (value >= 500 && value < 549) {
		res = 'excelent';
	} else if (value >= 550) {
		res = 'extreme';
	}
	return res;
}

function randomIntFromInterval(min,max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}

var audio = new Audio('fecales/' + randomIntFromInterval(0, 24) + '.wav');
audio.play();

function parseHashrate (hashrate) {
	var obj = {};
	obj.short = (hashrate.short !== 'n/a') ? Number.parseInt(hashrate.short) : 'n/a';
	obj.mid = (hashrate.mid !== 'n/a') ? Number.parseInt(hashrate.mid) : 'n/a';
	obj.long = (hashrate.long !== 'n/a') ? Number.parseInt(hashrate.long) : 'n/a';
	obj.highest = (hashrate.highest !== 'n/a') ? Number.parseInt(hashrate.highest) : 'n/a';
	return obj;
}

socket.on('updateEarnings', function (data) {
	if (data) {
		for (owner in data) {
			if (data[owner].paid == 0 && data[owner].balance == 0) return;
			data[owner].paid = Number.parseInt(data[owner].paid);
			data[owner].balance = Number.parseInt(data[owner].balance);
			var td = document.getElementById('earning-' + owner);
			var oldMaxBalance = parseInt(td.getAttribute('maxbalance'));
			var diff = (data[owner].paid + data[owner].balance) - oldMaxBalance;
			var earning = Number.parseFloat(td.textContent) + (diff / 1000000000000);
			td.textContent = earning;
			console.log('updated earnings for', owner, earning);
			td.setAttribute('maxbalance', oldMaxBalance + diff);
		}
	}
});

socket.on('some event', function (data) {
	var row = document.getElementById(data.instance);
	data.hashrate = parseHashrate(data.hashrate);
	row.setAttribute('active', '');
	var cells = row.children;
	var footer = document.getElementById('total-' + data.owner).children;
	var numberOfInstances = row.parentNode.children.length;
	var currentUptime = new Date(Date.now() - Number.parseInt(data.uptime));
	var hoursPast = Math.round(((Date.now() - currentUptime)/(1000*60*60)%24));
	var hourPrefix = (hoursPast > 1 || hoursPast === 0) ? ' horas' : ' hora';
	var timestampCell = cells[3];
	var strikesCell = cells[4];
	var triesCell = cells[5];
	timestampCell.firstElementChild.textContent = Math.ceil((Date.now() - Number.parseInt(data.timestamp)) / 1000);
	timestampCell.lastElementChild.textContent = (timestampCell.firstElementChild.textContent === 1) ? ' segundo' : ' segundos';
	strikesCell.firstElementChild.textContent = data.strikes;
	triesCell.firstElementChild.textContent = data.tries;

	var hashIndex = 10;//8
	var footerIndex = 3;//3
	
	cells[2].textContent = data.zone;
	cells[6].textContent = hoursPast + ' ' + hourPrefix;//4
	
	for (hash in data.hashrate) {
		var color = getColor(data.hashrate[hash]);
		var old = (cells[hashIndex].textContent !== 'n/a') ? Number.parseInt(cells[hashIndex].textContent.split(' ')[0]) : 0;
		var oldTotal = (footer[footerIndex].textContent !== 'n/a') ? Number.parseInt(footer[footerIndex].textContent.split(' ')[0]) : 0;	
		var oldPrefix = (data.hashrate[hash] - old > 0) ? '+' : '';
		var newValue;
		cells[hashIndex].textContent = (data.hashrate[hash] !== 'n/a') ? oldPrefix + (data.hashrate[hash] - old) + ' H/s' : 'n/a';
		cells[hashIndex].setAttribute('class', color);
		cells[hashIndex].setAttribute('hashrate', '');

		if (data.hashrate[hash] !== 'n/a') {
			newValue = (oldTotal - old) + data.hashrate[hash];
			footer[footerIndex].setAttribute('class', getColor(newValue / numberOfInstances));
			footer[footerIndex].textContent = newValue + ' H/s';
		} else if (data.hashrate[hash] === 'n/a' && old !== 'n/a') {
			newValue = (oldTotal - old);
			footer[footerIndex].textContent = newValue + ' H/s';
		}
		hashIndex++;
		footerIndex++;
	}
	hashIndex = 10;
	footerIndex = 3;
	setTimeout(function () {
		row.removeAttribute('active');
		for (hash in data.hashrate) {
			cells[hashIndex].removeAttribute('hashrate');
			cells[hashIndex].textContent = (data.hashrate[hash] !== 'n/a') ? data.hashrate[hash] + ' H/s' : 'n/a';
			hashIndex++;
			footerIndex++;
		}
	}, 2300);

});
//
/*
socket.on('add instance', function (data) {
	var tbody = document.getElementById(data.owner);
	if (!tbody) return;
	var childs = tbody.children;
	var found = false;
	for (var i = childs.length - 1; i >= 0; i--) {
		if (childs[i].id === data.instance) {
			found = true;
			break;
		}
	}

	if (!found) {
		var frag = document.createDocumentFragment();
		var footer = document.getElementById('total-' + data.owner).children;
		var tr = document.createElement('TR');
		data.hashrate = parseHashrate(data.hashrate);
	
		tr.setAttribute('id', data.instance);
		tr.setAttribute('class', 'row');
		frag.appendChild(tr);

		var currentUptime = new Date(Date.now() - Number.parseInt(data.uptime));
		var hoursPast = Math.round(((Date.now() - currentUptime)/(1000*60*60)%24));
		var hourPrefix = (hoursPast > 1 || hoursPast === 0) ? ' horas' : ' hora';
		var numberOfInstances = childs.length + 1;

		var instanceName = document.createElement('TD');
		instanceName.textContent = data.instance;
		tr.appendChild(instanceName);
		
		var project = document.createElement('TD');
		project.textContent = data.project;
		tr.appendChild(project);

		
		var zone = document.createElement('TD');
		zone.textContent = data.zone;
		tr.appendChild(zone);

		var uptime = document.createElement('TD');
		uptime.textContent = hoursPast + ' ' + hourPrefix;
		tr.appendChild(uptime);

		var tpc = document.createElement('TD');
		tpc.textContent = data.sys.tpc;
		tr.appendChild(tpc);

		var freq = document.createElement('TD');
		freq.textContent = data.sys.freq;
		tr.appendChild(freq);

		var cache = document.createElement('TD');
		cache.textContent =Number.parseInt(data.sys.cache.slice(0, -1)) / 1024 + 'MB';
		tr.appendChild(cache);

		var short = document.createElement('TD');
		short.textContent = (data.hashrate.short !== 'n/a') ? data.hashrate.short + ' H/s' : 'n/a';
		short.setAttribute('class', getColor(data.hashrate.short));
		tr.appendChild(short);

		var mid = document.createElement('TD');
		mid.textContent = (data.hashrate.mid !== 'n/a') ? data.hashrate.mid + ' H/s' : 'n/a';
		mid.setAttribute('class', getColor(data.hashrate.mid));
		tr.appendChild(mid);

		var long = document.createElement('TD');
		long.textContent = (data.hashrate.long !== 'n/a') ? data.hashrate.long + ' H/s' : 'n/a';
		long.setAttribute('class', getColor(data.hashrate.long));
		tr.appendChild(long);

		var highest = document.createElement('TD');
		highest.textContent = (data.hashrate.highest !== 'n/a') ? data.hashrate.highest + ' H/s' : 'n/a';
		highest.setAttribute('class', getColor(data.hashrate.highest));
		tr.appendChild(highest);

		tbody.appendChild(frag);
		console.log(typeof(data.hashrate.short))
		if (data.hashrate.short !== 'n/a') {
			var oldShortTotal = Number.parseInt(footer[2].textContent.split(' ')[0]);
			var newValue = (oldShortTotal) + data.hashrate.short; 
			footer[2].textContent = newValue + ' H/s';
			footer[2].setAttribute('class', getColor(newValue / numberOfInstances));
		} else {
			footer[2].textContent = 'n/a';
			//footer[2].textContent = data.hashrate.short + ' H/s';
			//footer[2].setAttribute('class', getColor(data.hashrate.short / numberOfInstances));
		}

		if (data.hashrate.mid !== 'n/a') {
			var oldMidTotal = Number.parseInt(footer[3].textContent.split(' ')[0]);
			var newValue = (oldMidTotal) + data.hashrate.mid; 
			footer[3].textContent = newValue + ' H/s';
			footer[3].setAttribute('class', getColor(newValue / numberOfInstances));
		} else {
			footer[3].textContent = 'n/a';
			//footer[3].textContent = data.hashrate.mid + ' H/s';
			//footer[3].setAttribute('class', getColor(data.hashrate.mid / numberOfInstances));
		}

		if (data.hashrate.long !== 'n/a') {
			var oldLongTotal = Number.parseInt(footer[4].textContent.split(' ')[0]);
			var newValue = (oldLongTotal) + data.hashrate.long; 
			footer[4].textContent = newValue + ' H/s';
			footer[4].setAttribute('class', getColor(newValue / numberOfInstances));
		} else {
			footer[4].textContent = 'n/a';
			//footer[4].textContent = data.hashrate.long + ' H/s';
			//footer[4].setAttribute('class', getColor(data.hashrate.long / numberOfInstances));
		}

		if (data.hashrate.highest !== 'n/a') {
			var oldHighestTotal = Number.parseInt(footer[5].textContent.split(' ')[0]);
			var newValue = (oldHighestTotal) + data.hashrate.highest; 
			footer[5].textContent = newValue + ' H/s';
			footer[5].setAttribute('class', getColor(newValue / numberOfInstances));
		} else {
			footer[5].textContent = 'n/a';
			//footer[5].setAttribute('class', getColor(data.hashrate.highest / numberOfInstances));
		}

		footer[0].textContent = 'Máquinas: ' + numberOfInstances + ' (' + numberOfInstances * 8 + ' cores)';
	}
});*/
}