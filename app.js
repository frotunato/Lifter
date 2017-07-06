const fs = require('fs');
const express = require('express');
const app = express();
const pug = require('pug');
const request = require('request');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.cached.Database('lifter.db');
const async = require('async');
const server = require('http').createServer(app);
const io = require('socket.io')(server, {transports: ['websocket', 'XHR-Polling']});
const bodyParser = require('body-parser');
const compress = require('compression');
const ping = require('ping');
const gcloud = "/root/google-cloud-sdk/bin/gcloud";
const whitelist = require('./whitelist.json');
const Log = require('log')
const log = new Log('info', fs.createWriteStream('log_' + Date.now() + '.log'));
const exec = require('child_process').exec;
const execSync = require('child_process').execSync;
const config = {ip: '0.0.0.0', port: 8084};
const cache = {};
const owners = {};

for (var i = whitelist.length - 1; i >= 0; i--) {
	if (!owners[whitelist[i]]) {
		owners[whitelist[i]] = {
			token: '',
			wallet: ''
		}
	}
}

for (ownerName in owners) {
	owners[ownerName].token = ('Bearer ' + execSync(`${gcloud} auth print-access-token ${ownerName}@gmail.com`)).replace('\n', '');
}

console.log('tokens are', owners);

app.set("view engine", "pug");
app.set("views", __dirname);
app.use(express.static(__dirname));
app.use(compress());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
db.run('CREATE TABLE IF NOT EXISTS records (owner TEXT, instance TEXT, project TEXT, zone TEXT, uptime INTEGER, timestamp INTEGER, short INTEGER, mid INTEGER, long INTEGER, highest INTEGER, tpc INTEGER, cache TEXT, freq TEXT, tries INTEGER, strikes INTEGER, insertDate INTEGER)');
db.run('CREATE TABLE IF NOT EXISTS earnings (owner TEXT, balance INTEGER, paid INTEGER, insertDate INTEGER)');

var mainQ = async.queue(function (task, cb) {
	console.log('[mainQ]', task.action, (task.obj) ? task.obj : '');

	log.alert('[mainQ]', task.action);
	if (task.action === 'checkMachines') {
		//console.log('[mainQ] Checking machines');
		checkMachines(function () {
			cb();
		})
	} else if (task.action === 'getZone') {
		//console.log('[mainQ] Getting zone for', task.obj.instance);
		getInstanceZone(task.obj, function () {
			cb();
		})
	} else if (task.action === 'controlMachine') {
		//console.log('[mainQ] Controlling machine for', task.obj.instance, 'strikes:', task.obj.strikes);
		controlMachine(task.obj, function (err, obj) {
			log.alert(err, 'instance', obj.instance, 'restarted');
			console.log(err, 'instance', obj.instance, 'restarted');
			cb();
		})
	}
}, 1);

function updateWhitelist (owner, callback) {
	if (!owners[owner]) {
		owners[owner] = {
			token: '',
			wallet: ''
		}
		fs.writeFile('./whitelist.json', JSON.stringify(whitelist), function (err) {
			log.alert('[updateWhitelist]', owner, err);
			callback(err);
		});
	} else {
		callback('Ya existe ese propietario');
	}
}

function insertEarnings (data, cb) {
	var insertDate = Date.now();
	db.run('begin', function (err) {
		var insert = function (obj, ownerName, callback) {
			db.run('INSERT INTO earnings (owner, balance, paid, insertDate) values ($owner, $balance, $paid, $insertDate)', {
				$owner: ownerName,
				$balance: obj.balance,
				$paid: obj.paid,
				$insertDate: insertDate
			}, function (err) {
				callback(err);
			});
		}
		async.eachOfSeries(data, insert, function (err) {
			console.log('finished!', err);
			db.run((err) ? 'rollback' : 'commit', function () {
				cb(err);
			});
		});
	});
}

function insertCache (data, cb) {
	var insertDate = Date.now();
	db.run('begin', function (err) {
		var insert = function (obj, callback) {
			db.run('INSERT INTO records (owner, instance, project, zone, uptime, timestamp, short, mid, long, highest, tpc, cache, freq, tries, strikes, insertDate) values ($owner, $instance, $project, $zone, $uptime, $timestamp, $short, $mid, $long, $highest, $tpc, $cache, $freq, $tries, $strikes, $insertDate)', {
				$owner : obj.owner,
				$instance: obj.instance,
				$project: obj.project,
				$zone: obj.zone,
				$timestamp: obj.timestamp,
				$short: obj.hashrate.short,
				$mid: obj.hashrate.mid,
				$long: obj.hashrate.long,
				$highest: obj.hashrate.highest,
				$tpc: obj.sys.tpc,
				$freq: obj.sys.freq,
				$cache: obj.sys.cache,
				$strikes: obj.strikes,
				$uptime: obj.uptime,
				$tries: obj.tries,
				$insertDate: insertDate
			}, function (err) {
				callback(err);
			});
		}
		async.eachSeries(data, insert, function (err) {
			console.log('finished!', err);
			db.run((err) ? 'rollback' : 'commit', function () {
				cb();
			});
		});
	});
}

function parseHashrate (hashrate) {
	return {
		short: (hashrate.short != null && hashrate.short !== 'n/a') ? Math.ceil(Number.parseInt(hashrate.short)) : 'n/a',
		mid: (hashrate.mid != null && hashrate.mid !== 'n/a') ? Math.ceil(Number.parseInt(hashrate.mid)) : 'n/a',
		long: (hashrate.long != null && hashrate.long !== 'n/a') ? Math.ceil(Number.parseInt(hashrate.long)) : 'n/a',
		highest: (hashrate.long != null && hashrate.highest !== 'n/a') ? Math.ceil(Number.parseInt(hashrate.highest)) : 'n/a'
	};
}

function parseInstanceList (obj, name) {
	for (zone in obj.items) {
	    if (obj.items[zone].instances) {
	      for (var i = obj.items[zone].instances.length - 1; i >= 0; i--) {
	        var inst = obj.items[zone].instances[i];
	        if (inst.name === name) {   
	          return inst.zone.substr(inst.zone.lastIndexOf('/') + 1);
	        }
	      }
	    }
	}
}

function getInstanceZone (obj, callback) {
	var options = {
		method: 'GET',
		url: 'https://www.googleapis.com/compute/v1/projects/' + obj.project + '/aggregated/instances',
		headers: {'Authorization': owners[obj.owner].token}
	};
	request(options, function (error, response, body) {
		var zone = parseInstanceList(JSON.parse(body), obj.instance);
		var instanceName = obj.instance;
		cache[instanceName].zone = zone;
		console.log('zone for', obj.instance, 'is', obj.zone);
		log.info('[getInstanceZone] got zone for', obj.instance, ':', obj.zone);
		console.log('Got zone for', obj.instance, ': ', obj.zone);
		callback();
	});
}

function controlMachine (obj, callback) {
	var instanceName = obj.instance;
	if (!owners[obj.owner] || obj.tries === 0 || obj.zone === 'UNKNOWN') {
		//delete cache[instanceName];
		log.error('[controlMachine] no tries left, no owner or unknown zone', obj);
		callback('no tries left, no owner or unknown zone', obj);
		return;
	}
	var prefix = 'https://www.googleapis.com/compute/v1/projects/' + obj.project + '/zones/' + obj.zone + '/instances/' + obj.instance;
	async.waterfall([
		function (wCb) {
			var options = {
				method: 'GET',
				url: prefix,
				headers: {'Authorization': owners[obj.owner].token}
			};
			request(options, function (error, response, body) {
				var status = JSON.parse(body).status;
				console.log('status', status)
				wCb(null, status);
			});
		}, 
		function (status, wCb) {
			if (status === 'RUNNING') {
				var options = {
					method: 'POST',
					url: prefix + '/stop',
					headers: {
						'Authorization': owners[obj.owner].token
					}
				};
				request(options, function (error, response, body) {
					var currentStatus = status;
					async.until(
						function () {
							return currentStatus === 'TERMINATED';
						}, 
						function (cb) {
							setTimeout(function () {
								request({
									method: 'GET',
									url: prefix,
									headers: {
										'Authorization': owners[obj.owner].token
									}
								}, function (error, response, body) {
									if (error || !body) {
										log.error('[controlMachine]', error, obj);
										currentStatus = 'TERMINATED';
										cb();
										return;
									}
									currentStatus = JSON.parse(body).status.replace('\n', '');
									log.alert('[controlMachine] got status', obj.instance, currentStatus);
									console.log('[controlMachine] got status', obj.instance, currentStatus);
									cb();
								})
							}, 300);
					}, function (err) {
						log.alert('[controlMachine]', obj.instance, status);
						status = currentStatus;
						wCb(err, status);
					});
				});
			} else {
				wCb(null, status);
			}
		}, function (status, wCb) {
			if (status === 'TERMINATED') {
				var options = {
					method: 'POST',
					url: prefix + '/start',
					headers: {'Authorization': owners[obj.owner].token}
				};
				request(options, function (error, response, body) {
					console.log('hey', error, options);
					wCb(error);
				});
			} else {
				wCb(null);
			}
		}
	], function (err, result) {
		console.log('Machine', obj.instance, 'got controlled', err);
		log.info('Machine', obj.instance, 'got controlled with error', err);
		callback(err, obj);
	});
}

function checkMachines (callback) {
	var q = async.queue(function (task, cb) {
	    controlMachine(task.machine, function (err, obj) {
	    	var instanceName = obj.instance;
	    	if (err) {
	    		log.error('[checkMachines] Got an error from', obj.instance, 'tries before being removed:', 5 - cache[instanceName].tries, err);
	    		console.log('Got an error from', obj.instance, 'tries before being removed:', 5 - cache[instanceName].tries, err);
	    		if (cache[instanceName].tries === 0) {
					console.log('DELETED', obj);
					log.error('[checkMachines] instance', obj, 'DELETED');
	    			delete cache[instanceName];
	    		} else {
	    			obj.tries = obj.tries - 1;
	    		}
	    	} else {
	    		cache[instanceName].tries = 5;
	    		cache[instanceName].timestamp = Date.now();
	    	}
	    	cb(err);
	    });
	}, 1);
	
	q.drain = function () {
		console.log('all items checked');
		log.info('[checkMachines] all items checked');
		callback();
	}

	for (instance in cache) {
		if (Date.now() - 600000 > cache[instance]) {
			cache[instance].hashrate.short = 'n/a';
			cache[instance].hashrate.mid = 'n/a';
			cache[instance].hashrate.long = 'n/a';
			cache[instance].uptime = Date.now();
		}

	}

	async.filter(cache, function (obj, fCb) {
		ping.sys.probe(obj.ip, function (isAlive) {
			var isDead = !isAlive;
			if (!isDead && Date.now() - 600000 > obj.timestamp) {
				console.log('Timestamp for machine', obj.instance, 'too old');
				log.alert('[checkMachines] timestamp for machine', obj.instance, 'too old');
				isDead = true;
			}
			fCb(null, isDead);
		}, {timeout: 2});
	}, function (err, results) {
		console.log('Machines to process', results);
		log.alert('[checkMachines] machines to process:', results);
		if (results.length === 0) {
			callback();
			return;
		}
		var ref = Date.now() - 180000;
		for (var i = results.length - 1; i >= 0; i--) {
			q.push({machine: results[i]}, function () {
				console.log('machine added to the queue');
			});
		}
	});	
}

function renewTokens (callback) {
	const prefix = 'Bearer ';
	async.eachOf(owners, function (owner, ownerName, cb) {
		exec(`${gcloud} auth print-access-token ${ownerName}@gmail.com`, [], function (error, stdout, stderr) {
			if (stdout && stdout.indexOf('ERROR') === -1) {
				owner.token = prefix + stdout.replace('\n', '');
			} else {
				log.error('[renewTokens] bad token for owner', ownerName);
			}
			cb(null);
		});
	}, function (err) {
		if (err) {
			log.error('[renewTokens]', err);
		}
		callback(null);
	})
}

function getEarnings (callback) {
	async.mapValues(owners, function (owner, ownerName, callback) {
		if (!owner.wallet) {
			callback(null, {balance: 0, paid: 0})
		} else {
			var url = `http://api.minexmr.com:8080/stats_address?address=${owner.wallet}&longpoll=false`;
			request.get(url, function (error, response, body) {
				if (error || !body) {
					log.error('[getEarnings]', owner, error);
					callback(null, {balance: 0, paid: 0});
				} else {
					body = JSON.parse(body);
					callback(null, {balance: body.stats.balance, paid: body.stats.paid});
				}
			});
		}
	}, function (err, results) {
		callback(err, results);
	});
}

function updateEarnings (callback) {
	async.waterfall([
		function (wCb) {
			db.get('SELECT insertDate FROM earnings WHERE _rowid_ = (SELECT MAX (_rowid_) FROM earnings)', function (err, row) {
				if (!row || (Date.now() - 900000) > row.insertDate) {
					wCb(err);
				} else {
					wCb('No need to update earnings');
				}
			});
		},
		function (wCb) {
			getEarnings(function (err, results) {
				io.emit('updateEarnings', results);
				wCb(err, results);
			});
		},
		function (results, wCb) {
			insertEarnings(results, function (err) {
				wCb(err)
			});
		}
	], function (err) {
		if (err && err !== 'No need to update earnings') {
			log.error('[updateEarnings]', err);
		}
		callback();
	})
}

async.forever(function (next) {
	var date = new Date();
	async.waterfall([
		function (wCb) {
			console.log('[' + date.toLocaleString() + ']', 'Renewing tokens');
			renewTokens (function (err) {
				wCb(null);
			});
		},
		function (wCb) {
			console.log('[' + date.toLocaleString() + ']', 'Checking machines');
			mainQ.push({obj: null, action: 'checkMachines'}, function () {
				wCb(null);
			});
		}, 
		function (wCb) {
			console.log('[' + date.toLocaleString() + ']', 'Inserting records');
			insertCache(JSON.parse(JSON.stringify(cache)), function (err) {
				log.error(err);
				wCb(null);
			});
		},
		function (wCb) {
			updateEarnings(function () {
				wCb(null);
			});
		}
	], function (err) {
		setTimeout(function () {
			next();
		}, 67000);
	});
}, function (err) {
	log.emergency('MAIN LOOP FAILED', err);
});

function mapToObject (array, key) {
	var res = {};
	for (var i = array.length - 1; i >= 0; i--) {
		res[array[i].owner] = array[i];
	}
	return res;
}

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

	function compare (a, b) {
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

/*
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
*/

app.route('/owners/:owner').post(function (req, res) {
	updateWhitelist(req.params.owner, function (err) {
		res.json({err: err});
	});
});

app.route('/data').get(function (req, res) {
	db.all('SELECT * FROM records WHERE insertDate > ' + (Date.now() - (6 * 3600000)), function (err, rows) {
	//db.all('SELECT * from records GROUP BY owner', function (err, rows) {
		//res.render('chart', {data: rows});
		console.log(err, rows.length);
		res.json({records: rows});
	})
});

app.route('/chart').get(function (req, res) {
	res.render('chart', {});
});

app.route('/earnings').get(function (req, res) {
	db.all('SELECT * FROM earnings', function (err, rows) {
	//db.all('SELECT * from records GROUP BY owner', function (err, rows) {
		//res.render('chart', {data: rows});
		res.json({earnings: rows});
	})
});

app.route('/check')
	.get(function (req, res) {
		log.info('[GET] from', req.connection.remoteAddress);
		var dailyDate = new Date();
		dailyDate.setHours(0, 0, 0);
		var threshold = dailyDate.getTime();
		db.all(`select owner, min(balance) as minBalance, max(balance) as maxBalance, min(paid) as minPaid, max(paid) as maxPaid from earnings where insertDate > ${threshold} AND (balance > 0 OR paid > 0) group by owner`, function (err, rows) {
			res.render("index", {
				cache: getGroups(JSON.parse(JSON.stringify(cache))),
				earnings: mapToObject(rows, 'owner')
			});
		});		
	})
	.post(function (req, res) {
		if (!req.body || !req.body.project || !req.body.instance) {
			console.log('[ERROR] invalid request');
			return;
		}
		var date = new Date();
		req.body.project = req.body.project.substr(req.body.project.indexOf('.') + 1, req.body.project.lastIndexOf('.') - 2);
		req.body.owner = req.body.instance.split("-")[4];
		req.body.owner = (req.body.owner === 'salchipapa') ? 'salchipapa.llameante' : req.body.owner;
		req.body.wallet = (req.body.wallet) ? req.body.wallet : '';
		var owner = req.body.owner;
		if (!owners[owner]) {
			console.log('no valid owner', req.body.owner);
			return;
		}

		if (!owners[owner].wallet) {
			owners[owner].wallet = req.body.wallet;
		}

		var instanceName = req.body.instance;
		if (cache[instanceName]) {
			if (cache[instanceName.ip !== req.connection.remoteAddress]) {
				mainQ.push({obj: cache[instanceName], action: 'getZone'}, function () {
					console.log('Ip changed for', cache[instanceName].instance, 'got new zone...');
				});
			}
			cache[instanceName].timestamp = Date.now();
			cache[instanceName].ip = req.connection.remoteAddress;
			cache[instanceName].uptime = req.body.uptime;
			cache[instanceName].hashrate = parseHashrate(req.body.hashrate);
			cache[instanceName].sys = req.body.sys;
			//cache[instanceName].wallet = req.body.wallet;

			if (cache[instanceName].hashrate.long !== 'n/a' && Number.parseInt(cache[instanceName].hashrate.long) < 400) {
				cache[instanceName].strikes++;
				log.alert('[ROUTER] low performance for', instanceName, 'strikes left:', cache[instanceName].strikes);
				console.log('LOW PERFORMANCE FOR', instanceName, 'strikes:', cache[instanceName].strikes);
				if (cache[instanceName].strikes >= 15) {
					log.alert('[ROUTER] trying to perform restart for', instanceName);
					console.log('ROUTER] trying to perform restart for', instanceName);
					cache[instanceName].strikes = 0;
					mainQ.push({obj: cache[instanceName], action: 'controlMachine'}, function () {
						console.log('Machine', instanceName, 'restarted due low performance');
					});
				}
			} else {
				cache[instanceName].strikes = 0;
			}
			io.emit('some event', cache[instanceName]);
		} else {
			if (req.body.owner !== '' && req.body.project !== '') {
				cache[instanceName] = {
					instance: req.body.instance, 
					project: req.body.project, 
					timestamp: Date.now(),
					owner: req.body.owner,
					zone: 'UNKNOWN',
					ip: req.connection.remoteAddress,
					uptime: req.body.uptime,
					tries: 5,
					mail: (req.body.mail) ? req.body.mail : '',
					hashrate: parseHashrate(req.body.hashrate),
					sys: req.body.sys,
					strikes: 0
					//wallet: req.body.wallet
				}
				mainQ.push({obj: cache[instanceName], action: 'getZone'}, function () {
					console.log('Got zone for', cache[instanceName].instance);
				});
				io.emit('add instance', cache[instanceName]);
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