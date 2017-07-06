var express = require('express');
var app = express();
const pug = require('pug');
var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var server = require('http').createServer(app);
var bodyParser = require('body-parser');
var compress = require('compression');
var ping = require('ping');
var cache = {};
var gcloud = "/root/google-cloud-sdk/bin/gcloud";
const exec = require('child_process').exec;
var config = {
	ip: '0.0.0.0',
	port: 8084
};
var owners = ['frotunato', 'nanowaka', 'jpc988', 'fortunato1911', 'guersak', 'hhgt55h', 'acruzc93'];

app.set("view engine", "pug");
app.set("views", __dirname);
app.use(express.static(__dirname));
app.use(compress());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


var mainQ = async.queue(function (task, cb) {
	if (task.action === 'checkMachines') {
		console.log('[mainQ] Checking machines');
		checkMachines(function () {
			cb();
		})
	} else if (task.action === 'getZone') {
		console.log('[mainQ] Getting zone for', task.obj.instance);
		getInstanceZone(task.obj, function () {
			cb();
		})
	}
}, 1);


function parseInstanceList (output) {
	var arr = output.split("\n");
	var res = null;
	if (arr.length === 3) {
		res = arr[1].split('  ')[1];
	}
	return res.trim();
}

function getInstanceZone (obj, callback) {
	async.waterfall([
		function (wCb) {
			exec(gcloud + ' auth login ' + obj.owner + '@gmail.com', function (error, stdout, stderr) {
				console.log('login phase for', obj.owner, error);
				wCb(error);
			});
		}, 
		function (wCb) {
			exec(gcloud + ' config set project ' + obj.project, function (error, stdout, stderr) {
				console.log('project phase for', obj.project, error);
				wCb(error);
			});
		},
		function (wCb) {
			exec(gcloud + ' compute instances list ' + obj.instance, function (error, stdout, stderr) {
				console.log('list phase for', obj.project, error);
				var zone = parseInstanceList(stdout);
				var instanceName = obj.instance;
				cache[instanceName].zone = zone;
				wCb(error);
			})
		}
	], function (err) {
		console.log('Got zone for instance', obj.instance, ': ', obj.zone);
		callback();
	});
}

function controlMachine (obj, action, callback) {
	var anyError = false;
	console.log('checking machine from', obj.owner);
	if (owners.indexOf(obj.owner) === -1 || obj.tries === 0 || obj.zone === 'UNKNOWN') {
		var instanceName = obj.instance;
		//delete cache[instanceName];
		callback('no tries left, no owner or unknown zone', obj);
		return;
	}
	
	async.waterfall([
		function (wCb) {
			exec(gcloud + ' auth login ' + obj.owner + '@gmail.com', function (error, stdout, stderr) {
				console.log('login phase for', obj.owner, error);
				wCb(error);
			});
		},
		function (wCb) {
			exec(gcloud + ' config set project ' + obj.project, function (error,stdout,stderr) {
				console.log('project phase for', obj.project, error);
				wCb(error);
			});
		},
		function (wCb) {
			exec(gcloud + ' config set compute/zone ' + obj.zone, function (error,stdout,stderr) {
				console.log('zone phase for', obj.zone, error);
				wCb(error);
			});
		},
		function (wCb) {
			exec(gcloud + ' compute instances stop ' + obj.instance, function (error,stdout,stderr) {
				console.log('action stop phase for', obj.instance, error);
				wCb(error);
			});
		},
		function (wCb) {
			exec(gcloud + ' compute instances start ' + obj.instance, function (error,stdout,stderr) {
				console.log('action start phase for', obj.instance, error);
				wCb(error);
			});
		}
	], function (err, result) {
		console.log('Checking error for', obj.instance, err);
		callback(err, obj);
	});
}

function checkMachines (callback) {
	var q = async.queue(function (task, cb) {
	    controlMachine(task.machine, task.action, function (err, obj) {
	    	var instanceName = obj.instance;
	    	if (err) {
	    		console.log('Got an error from', obj.instance, 'tries before being removed:', 5 - obj.tries, err);
	    		if (obj.tries === 0) {
					console.log('DELETED', obj);
	    			delete cache[instanceName];
	    		} else {
	    			obj.tries = obj.tries - 1;
	    		}
	    	} else {
	    		cache[instanceName].timestamp = Date.now();
	    	}
	    	cb(obj);
	    });
	}, 1);
	
	q.drain = function () {
		console.log('all items checked');
		callback();
	}

	async.filter(cache, function (obj, fCb) {
		ping.sys.probe(obj.ip, function (isAlive) {
			if (isAlive && Date.now() - 600000 > obj.timestamp) {
				console.log('Timestamp for machine', obj.instance, 'too old');
				isAlive = false;
			}
			//if (!isAlive) {
			//	cache.splice(searchMachine(obj.project, obj.instance, obj.owner), 1);
			//}
			fCb(null, !isAlive);
		}, {timeout: 2});
	}, function (err, results) {
		console.log('Machines to process', results);
		
		if (results.length === 0) {
			callback();
			return;
		}
		var action = '';
		var ref = Date.now() - 180000;
		for (var i = results.length - 1; i >= 0; i--) {
			action = 'start';
			q.push({machine: results[i], action: action}, function () {
				console.log('machine processed');
			});
		}
	});	
}

async.forever(function (next) {
	var date = new Date();
	console.log('[' + date.toLocaleString() + ']', 'checking...');
	mainQ.push({obj: null, action: 'checkMachines'}, function () {
		setTimeout(function () {
			console.log('Loop completed');
			next();
		}, 60000);
	});
}, function (err) {

});

/*
function buildTable (data) {
	var superMax = [0, 0 ,0];
	var superHigh = 0;
	var superCount = 0;
	var superCore = 0;
	var main = '';
	
	var getColor = function (value) {
		var res = '';
		if (value === 'n/a' || value === 0) {
			res = 'darkgrey';
		} else if (value < 200) {
			res = 'indianred';
		} else if (value >= 200 && value < 300) {
			res = 'orange';
		} else if (value >= 300 && value < 400) {
			res = 'yellow';
		} else if (value >= 400 < 450) {
			res = 'limegreen';
		} else if (value >= 450 < 500) {
			res = 'royalblue';
		} else if (value >= 500) {
			res = 'violet';
		}
		return res;
	}

	for (var key in data) {
		var table = '<div style="display:table;margin:auto;margin-bottom:25px;background:darkgrey;border-style:solid" class=""><h2 style="background:darkgrey;margin-bottom:0px;">' + key + '</h2><table style="background:white;" class="pure-table pure-table-bordered"><thead style="font-weight:bolder;"><tr><td>Instancia</td><td>Proyecto</td><td>Zona</td><td>Carga</td><td>Uptime</td><td>Ip externa</td><td>2.5s</td><td>60s</td><td>15m</td><td>Max</td></tr></thead><tbody>';
		var max = [0, 0, 0];
		var maxHigh = 0;
		var count = 0;
		for (var i = data[key].length - 1; i >= 0; i--) {
			count++;
			var machine = data[key][i];
			var records = machine.records.split(' ');
			var highest = machine.highest.split(' ');
			var prefix = ' H/s';
			var currentUptime = Date.parse(machine.uptime + " GMT");
			var hoursPast = Math.round(((Date.now() - currentUptime)/(1000*60*60)%24));
			var hourPrefix = (hoursPast > 1 || hoursPast === 0) ? ' horas' : ' hora';
			if (records.length === 1) {
				records = [null, 'NO DATA', 'NO DATA', 'NO DATA'];
				prefix = '';
			} else {
				records[1] = (records[1]) ? Number.parseInt(records[1]) : 0;
				records[2] = (records[2]) ? Number.parseInt(records[2]) : 0;
				records[3] = (records[3]) ? Number.parseInt(records[3]) : 0;
				max[0] += records[1];
				max[1] += records[2];
				max[2] += records[3];
			}
			if (highest.length === 1) {
				highest = [null, 'NO DATA'];
				prefix = '';
			} else {
				highest[1] = (highest[1]) ? Number.parseInt(highest[1]) : 0;
				maxHigh += highest[1];
			}
		
			table += '<tr><td>' + machine.instance + '</td><td>' + machine.project + '</td><td>' + machine.zone + '</td><td>' + machine.usage + '%</td><td>' + machine.uptime + ' GMT (' + hoursPast + hourPrefix + ')' + '</td><td><a href="http://' + machine.ip + ':80">' + machine.ip + '</a></td><td ' + getColor(records[1]) + '>' + records[1] + prefix + '</td><td ' + getColor(records[2]) + '>' + records[2] + prefix + '</td><td ' + getColor(records[3]) +'>' + records[3] + prefix + '</td><td ' + getColor(highest[1]) + '>' + highest[1] + prefix + '</td></tr>';
			superCount++;
		}
		superMax[0] += max[0];
		superMax[1] += max[1];
		superMax[2] += max[2];
		superHigh += maxHigh;
		superCore += count * 8;
		tfoot = '<tfoot style="font-weight:bolder;border-top-style:groove;background:rgba(169, 169, 169, 0.31)"><tr><td>Máquinas: ' + count + ' (' + (count * 8) + ' cores)</td><td></td><td></td><td></td><td></td><td style="text-align:end;">Total:</td><td>' + max[0] + ' H/s</td><td>' + max[1] + ' H/s</td><td>' + max[2] + ' H/s</td><td>' + maxHigh + ' H/s</td></tr></tfoot>';
		table += '</tbody>' + tfoot + '</table></div>';
		main += table;
	}
	var html = '<html><head><title>Gibe moni pls</title><link rel="stylesheet" href="https://unpkg.com/purecss@1.0.0/build/pure-min.css" integrity="sha384-nn4HPE8lTHyVtfCBi5yW9d20FjT8BJwUXyWZT9InLYax14RDjBj46LmSztkmNP9w" crossorigin="anonymous"></head><body"><div class="pure-g"><div style="background: url(http://i.imgur.com/86Heupc.png);background-size:contain;" class="pure-u-2-24"></div><div style="text-align:center;background:silver;font-family:monospace;background:url(https://lh5.ggpht.com/GJO-iHaNMuP5z8IQs6CMrL2NPGJ2DyQ3BGSLY54jlhE7dQ5SQ-jgAAOiRZaVuc8wHg=h900);" class="pure-u-20-24">';
	html += '<pre style="margin:auto;margin-bottom:30px;background:rgb(218, 212, 176);border-bottom-style:groove;border-bottom-color:black;color:crimson;font-weight:bolder;">Total de potencia RAPIÑADA (' + superCount + ' máquinas, ' + superCore + ' cores): ' + superMax[0] + ' H/s (2.5s) ' + superMax[1] + ' H/s (60s) ' + superMax[2] + ' H/s (15m)  => PICO MAXIMO: ' + superHigh + ' H/s </pre><div>';
	html += main;
	html += '</div></div><div style="background: url(http://i.imgur.com/86Heupc.png);background-size:contain;" class="pure-u-2-24"></div></body></html>';
	return html;
}
*/
function getGroups (data) {
	var groups = {};
	for (instance in data) {
		var owner = data[instance].owner;
		groups[owner] = groups[owner] || [];
		groups[owner].push(data[instance]);
	}

	for (owner in groups) {
		groups[owner].sort(compare);
	}

	function compare (a,b) {
	  var arrA = a.instance.split('-');
	  var arrB = b.instance.split('-');
	  var pA = Number.parseInt(arrA[3]);
	  var iA = Number.parseInt(arrA[1]);
	  var pB = Number.parseInt(arrB[3]);
	  var iB = Number.parseInt(arrB[1])
	  if (pA < pB)
	    return -1;
	  if (pA > pB)
	    return 1;
	  if (pA === pB) {
	  	if (iA > iB) 
	 	  return 1;
	 	if (iA < iB)
	 	  return -1
	  }
	}
	return groups;
}

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
	} else if (value >= 500) {
		res = 'excelent';
	}
	return res;
}

app.route('/check')
	.get(function (req, res) {
		res.render("index", {
			cache: getGroups(JSON.parse(JSON.stringify(cache)))
		});
	})
	.post(function (req, res) {
		if (!req.body || !req.body.project || !req.body.instance) {
			console.log('[ERROR]', sourceTimestamp);
			return;
		}
		var date = new Date();
		var sourceTimestamp = date.toUTCString();
		req.body.project = req.body.project.substr(req.body.project.indexOf('.') + 1, req.body.project.lastIndexOf('.') - 2);
		req.body.owner = req.body.instance.split("-")[4];
		
		if (owners.indexOf(req.body.owner) === -1) {
			console.log('no valid owner', req.body.owner);
			return;
		}
		var instanceName = req.body.instance;
		var uptime = (req.body.uptime) ? req.body.uptime : 'NO DATA';
		if (cache[instanceName]) {
			if (cache[instanceName.ip !== req.connection.remoteAddress]) {
				mainQ.push({obj: cache[instanceName], action: 'getZone'}, function () {
					console.log('Ip changed for', cache[instanceName].instance, 'got new zone...');
				});
			}
			cache[instanceName].timestamp = Date.now();
			cache[instanceName].ip = req.connection.remoteAddress;
			cache[instanceName].uptime = uptime;
			cache[instanceName].hashrate = req.body.hashrate;
			cache[instanceName].sys = req.body.sys;
			
		} else {
			if (req.body.owner !== '' && req.body.project !== '') {
				cache[instanceName] = {
					instance: req.body.instance, 
					project: req.body.project, 
					timestamp: Date.now(),
					owner: req.body.owner,
					zone: 'UNKNOWN',
					ip: req.connection.remoteAddress,
					uptime: uptime,
					tries: 5,
					mail: (req.body.mail) ? req.body.mail : '',
					hashrate: req.body.hashrate,
					sys: req.body.sys
				}
				mainQ.push({obj: cache[instanceName], action: 'getZone'}, function () {
					console.log('Got zone for', cache[instanceName].instance);
				});
			} else {
				console.log('[WARNING] project', req.body.project, 'has no owner!');				
			}
		}
		console.log('[' + date.toLocaleString() + ']', req.body.instance);
		res.status(200).end();
	});

server.listen(config.port, config.ip, function () {
    console.log('Server hub launched at', config.ip, config.port);
});