const dot = require('dot');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var config = {
	ip: '0.0.0.0',
	port: 4000
};
var request = require('request');
var fs = require('fs');
var Log = require('log')
var log = new Log('info', fs.createWriteStream('my.log'));
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.cached.Database('lifter.db');
var async = require('async');
var io = require('socket.io')(server);

app.use(express.static(__dirname));
app.set("view engine", "pug");
app.set("views", __dirname);

var data = {"instance-1-project-4-jpc988":{"instance":"instance-1-project-4-jpc988","project":"fair-station-169119","timestamp":1498159681608,"usage":"799","owner":"jpc988","zone":"us-east4-c","ip":"35.186.160.175","uptime":"2017-06-22 13:13:27","tries":5,"mail":"","hashrate":{"short":"466","mid":"411","long":"550","highest":"512"},"sys":{"tpc":"1","freq":"2GHZ","cache":"2050KB"}},"instance-1-project-3-acruzc93":{"instance":"instance-1-project-3-acruzc93","project":"proyecto-3-170212","timestamp":1498159681628,"usage":"799","owner":"acruzc93","zone":"us-east4-c","ip":"35.186.185.188","uptime":"2017-06-21 21:38:56","tries":5,"mail":"","hashrate":{"short":"416","mid":"411","long":"450","highest":"512"},"sys":{"tpc":"1","freq":"2GHZ","cache":"2050KB"}},"instance-1-project-2-jpc988":{"instance":"instance-1-project-2-jpc988","project":"proyecto-2-169119","timestamp":1498159681551,"usage":"799","owner":"jpc988","zone":"us-east4-c","ip":"35.186.174.162","uptime":"2017-06-22 14:02:27","tries":5,"mail":"","hashrate":{"short":"416","mid":"411","long":"450","highest":"512"},"sys":{"tpc":"1","freq":"2GHZ","cache":"2050KB"}},"instance-1-project-5-jpc988":{"instance":"instance-1-project-5-jpc988","project":"third-tome-169119","timestamp":1498159681413,"usage":"799","owner":"jpc988","zone":"us-east4-c","ip":"35.186.185.132","uptime":"2017-06-22 13:38:21","tries":5,"mail":"","hashrate":{"short":"416","mid":"411","long":"450","highest":"512"},"sys":{"tpc":"1","freq":"2GHZ","cache":"2050KB"}},"instance-1-project-2-acruzc93":{"instance":"instance-1-project-2-acruzc93","project":"proyecto-2-170211","timestamp":1498159681604,"usage":"799","owner":"acruzc93","zone":"us-east4-c","ip":"35.186.168.96","uptime":"2017-06-21 22:08:35","tries":5,"mail":"","hashrate":{"short":"416","mid":"411","long":"450","highest":"512"},"sys":{"tpc":"1","freq":"2GHZ","cache":"2050KB"}},"instance-1-project-1-acruzc93":{"instance":"instance-1-project-1-acruzc93","project":"proyecto-1-170211","timestamp":1498159681579,"usage":"799","owner":"acruzc93","zone":"us-east4-c","ip":"35.186.170.222","uptime":"2017-06-21 22:46:52","tries":5,"mail":"","hashrate":{"short":"416","mid":"411","long":"450","highest":"512"},"sys":{"tpc":"1","freq":"2GHZ","cache":"2050KB"}},"instance-1-project-3-jpc988":{"instance":"instance-1-project-3-jpc988","project":"fluted-century-169119","timestamp":1498159681770,"usage":"799","owner":"jpc988","zone":"us-east4-c","ip":"35.186.178.63","uptime":"2017-06-22 13:53:33","tries":5,"mail":"","hashrate":{"short":"416","mid":"411","long":"450","highest":"512"},"sys":{"tpc":"1","freq":"2GHZ","cache":"2050KB"}},"instance-1-project-1-exoticpluto7":{"instance":"instance-1-project-1-exoticpluto7","project":"proyecto-1-171415","timestamp":1498159681952,"usage":"800","owner":"exoticpluto7","zone":"us-east4-b","ip":"35.186.175.220","uptime":"2017-06-22 18:28:53","tries":5,"mail":"","hashrate":{"short":"416","mid":"411","long":"450","highest":"512"},"sys":{"tpc":"1","freq":"2GHZ","cache":"2050KB"}},"instance-1-project-4-acruzc93":{"instance":"instance-1-project-4-acruzc93","project":"proyecto-4-170212","timestamp":1498159681955,"usage":"799","owner":"acruzc93","zone":"us-east4-c","ip":"35.186.191.205","uptime":"2017-06-21 23:02:45","tries":5,"mail":"","hashrate":{"short":"416","mid":"411","long":"450","highest":"512"},"sys":{"tpc":"1","freq":"2GHZ","cache":"2050KB"}},"instance-1-project-10-guersak":{"instance":"instance-1-project-10-guersak","project":"nifty-atlas-170000","timestamp":1498159681845,"usage":"798","owner":"guersak","zone":"us-east4-a","ip":"35.186.179.154","uptime":"2017-06-22 18:15:04","tries":5,"mail":"","hashrate":{"short":"416","mid":"411","long":"450","highest":"512"},"sys":{"tpc":"1","freq":"2GHZ","cache":"2050KB"}},"instance-1-project-1-jpc988":{"instance":"instance-1-project-1-jpc988","project":"onyx-seeker-169119","timestamp":1498159681273,"usage":"799","owner":"jpc988","zone":"us-east4-c","ip":"35.186.188.83","uptime":"2017-06-22 14:09:16","tries":5,"mail":"","hashrate":{"short":"416","mid":"411","long":"450","highest":"512"},"sys":{"tpc":"1","freq":"2GHZ","cache":"2050KB"}},"instance-1-project-3-exoticpluto7":{"instance":"instance-1-project-3-exoticpluto7","project":"proyecto-3-171415","timestamp":1498159682118,"usage":"799","owner":"exoticpluto7","zone":"us-east4-b","ip":"35.186.178.246","uptime":"2017-06-22 00:56:25","tries":5,"mail":"","hashrate":{"short":"416","mid":"411","long":"450","highest":"512"},"sys":{"tpc":"1","freq":"2GHZ","cache":"2050KB"}},"instance-1-project-11-fortunato1911":{"instance":"instance-1-project-11-fortunato1911","project":"proy11-170111","timestamp":1498159682212,"usage":"799","owner":"fortunato1911","zone":"us-east4-c","ip":"35.186.166.239","uptime":"2017-06-21 21:46:36","tries":5,"mail":"","hashrate":{"short":"416","mid":"411","long":"450","highest":"512"},"sys":{"tpc":"1","freq":"2GHZ","cache":"2050KB"}},"instance-1-project-6-guersak-us-east4-c":{"instance":"instance-1-project-6-guersak-us-east4-c","project":"proyecto-6-170000","timestamp":1498159681406,"usage":"799","owner":"guersak","zone":"us-east4-c","ip":"35.186.163.157","uptime":"2017-06-22 04:44:53","tries":5,"mail":"","hashrate":{"short":"416","mid":"411","long":"450","highest":"512"},"sys":{"tpc":"1","freq":"2GHZ","cache":"2050KB"}},"instance-1-project-9-fortunato1911-us-east4-c":{"instance":"instance-1-project-9-fortunato1911-us-east4-c","project":"proy9-170006","timestamp":1498159682299,"usage":"799","owner":"fortunato1911","zone":"us-east4-c","ip":"35.188.228.72","uptime":"2017-06-21 22:42:53","tries":5,"mail":"","hashrate":{"short":"416","mid":"411","long":"450","highest":"512"},"sys":{"tpc":"1","freq":"2GHZ","cache":"2050KB"}},"instance-1-project-7-guersak-us-east4-c":{"instance":"instance-1-project-7-guersak-us-east4-c","project":"proyecto-7-170000","timestamp":1498159681715,"usage":"799","owner":"guersak","zone":"us-east4-c","ip":"35.188.237.93","uptime":"2017-06-22 16:00:07","tries":5,"mail":"","hashrate":{"short":"416","mid":"411","long":"450","highest":"512"},"sys":{"tpc":"1","freq":"2GHZ","cache":"2050KB"}},"instance-1-project-8-fortunato1911-us-east4-b":{"instance":"instance-1-project-8-fortunato1911-us-east4-b","project":"proy7-170001","timestamp":1498159681467,"usage":"799","owner":"fortunato1911","zone":"us-east4-b","ip":"35.186.162.145","uptime":"2017-06-22 06:07:01","tries":5,"mail":"","hashrate":{"short":"416","mid":"411","long":"450","highest":"512"},"sys":{"tpc":"1","freq":"2GHZ","cache":"2050KB"}},"instance-1-project-5-acruzc93":{"instance":"instance-1-project-5-acruzc93","project":"proyecto-5-170212","timestamp":1498159681255,"usage":"799","owner":"acruzc93","zone":"us-east4-c","ip":"35.186.179.104","uptime":"2017-06-21 23:06:22","tries":5,"mail":"","hashrate":{"short":"416","mid":"411","long":"450","highest":"512"},"sys":{"tpc":"1","freq":"2GHZ","cache":"2050KB"}},"instance-1-project-10-fortunato1911":{"instance":"instance-1-project-10-fortunato1911","project":"helpful-metric-170006","timestamp":1498159682186,"usage":"799","owner":"fortunato1911","zone":"us-east4-c","ip":"35.188.233.116","uptime":"2017-06-22 08:11:21","tries":5,"mail":"","hashrate":{"short":"416","mid":"411","long":"450","highest":"512"},"sys":{"tpc":"1","freq":"2GHZ","cache":"2050KB"}},"instance-1-project-7-fortunato1911-us-east4-b":{"instance":"instance-1-project-7-fortunato1911-us-east4-b","project":"uplifted-crow-170023","timestamp":1498159681510,"usage":"799","owner":"fortunato1911","zone":"us-east4-b","ip":"35.186.171.52","uptime":"2017-06-22 06:31:26","tries":5,"mail":"","hashrate":{"short":"416","mid":"411","long":"450","highest":"512"},"sys":{"tpc":"1","freq":"2GHZ","cache":"2050KB"}},"instance-1-project-2-exoticpluto7":{"instance":"instance-1-project-2-exoticpluto7","project":"proyecto2-171415","timestamp":1498159681437,"usage":"799","owner":"exoticpluto7","zone":"us-east4-b","ip":"35.186.190.130","uptime":"2017-06-21 23:14:22","tries":5,"mail":"","hashrate":{"short":"416","mid":"411","long":"450","highest":"512"},"sys":{"tpc":"1","freq":"2GHZ","cache":"2050KB"}},"instance-1-project-8-guersak-us-east4-c":{"instance":"instance-1-project-8-guersak-us-east4-c","project":"proyecto-8-170000","timestamp":1498159681492,"usage":"799","owner":"guersak","zone":"us-east4-c","ip":"35.188.239.206","uptime":"2017-06-21 22:47:48","tries":5,"mail":"","hashrate":{"short":"416","mid":"411","long":"450","highest":"512"},"sys":{"tpc":"1","freq":"2GHZ","cache":"2050KB"}},"instance-1-project-9-guersak-us-east4-c":{"instance":"instance-1-project-9-guersak-us-east4-c","project":"proyecto-9-170000","timestamp":1498159681808,"usage":"799","owner":"guersak","zone":"us-east4-c","ip":"35.186.191.67","uptime":"2017-06-22 00:58:55","tries":5,"mail":"","hashrate":{"short":"416","mid":"411","long":"450","highest":"512"},"sys":{"tpc":"1","freq":"2GHZ","cache":"2050KB"}}};
var owners = {
	'exoticpluto7': {token: '', wallet: '4A6xNd9dSaqL29V2mzpzDFfcUg4JG4wy2PZq5iAmy9ezXvvsVaYzdCPhikXYYTQ54DWpT7VVSfen6LqfgoNPmuP5Cz8o5ZR'},
	'salchipapa.llameante': {token: '', wallet: '4A6xNd9dSaqL29V2mzpzDFfcUg4JG4wy2PZq5iAmy9ezXvvsVaYzdCPhikXYYTQ54DWpT7VVSfen6LqfgoNPmuP5Cz8o5ZR'}
}
function parseHashrate (hashrate) {
	var obj = {};
	obj.short = (hashrate.short !== 'n/a') ? Math.ceil(Number.parseInt(hashrate.short)) : 'n/a';
	obj.mid = (hashrate.mid !== 'n/a') ? Math.ceil(Number.parseInt(hashrate.mid)) : 'n/a';
	obj.long = (hashrate.long !== 'n/a') ? Math.ceil(Number.parseInt(hashrate.long)) : 'n/a';
	obj.highest = (hashrate.highest !== 'n/a') ? Math.ceil(Number.parseInt(hashrate.highest)) : 'n/a';
	return obj;
}
for (instance in data) {
	data[instance].hashrate = parseHashrate(data[instance].hashrate);
}

db.get('SELECT insertDate FROM earnings WHERE _rowid_ = (SELECT MAX (_rowid_) FROM earnings)', function (err, row) {

	console.log(typeof row.insertDate)
});

db.run('CREATE TABLE IF NOT EXISTS earnings (owner TEXT, balance INTEGER, paid INTEGER, insertDate INTEGER)');
db.run('CREATE TABLE IF NOT EXISTS records (owner TEXT, instance TEXT, project TEXT, zone TEXT, uptime INTEGER, timestamp INTEGER, short INTEGER, mid INTEGER, long INTEGER, highest INTEGER, tpc INTEGER, cache TEXT, freq TEXT, tries INTEGER, strikes INTEGER, insertDate INTEGER)');
//db.run('CREATE TABLE IF NOT EXISTS earnings (owner TEXT, wallet TEXT, balance ')
db.run('begin', function (err) {
	var insertDate = Date.now();
	var run = function (obj, callback) {
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
			$tries: obj.tries,
			$insertDate: insertDate
		}, function (err) {
			callback(err);
		});
	};
	async.eachSeries(data, run, function (err) {
		console.log('finished!', err);
		db.run((err) ? 'rollback' : 'commit');
	});
});

var groups = {};
for (instance in data) {
	var owner = data[instance].owner;
	groups[owner] = groups[owner] || [];
	groups[owner].push(data[instance]);
}

for (owner in groups) {
	groups[owner].sort(compare);
}

//console.log(groups)

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

setInterval(function () {
	data["instance-1-project-4-jpc988"].hashrate = {
		mid: Math.floor((Math.random() * 570) + 1),
		short: Math.floor((Math.random() * 570) + 1),
		long: Math.floor((Math.random() * 570) + 1),
		highest: Math.floor((Math.random() * 570) + 1)
	}
	io.emit('some event', data["instance-1-project-4-jpc988"]);
}, 5000)

setInterval(function () {
	var nObj = {"instance":"instance-1-project-7-jpc988","project":"fair-station-169119","timestamp":1498159681608,"usage":"799","owner":"jpc988","zone":"us-east4-c","ip":"35.186.160.175","uptime":"2017-06-22 13:13:27","tries":5,"mail":"","hashrate":{"short":"466","mid":"411","long":"550","highest":"512"},"sys":{"tpc":"1","freq":"2GHZ","cache":"2050KB"}};
	io.emit('add instance', nObj);
}, 5000);


setTimeout(function () {
	console.log('go!')
	async.mapValues(owners, function (owner, ownerName, callback) {
		var url = `http://api.minexmr.com:8080/stats_address?address=${owner.wallet}&longpoll=false`;
		request.get(url, function (error, response, body) {
			if (error) {

			} else {

			}
			console.log(ownerName)
			body = JSON.parse(body);
			callback(null, {balance: body.stats.balance, paid: body.stats.paid});
		});
	}, function (err, results) {
		console.log(results)
	})
}, 5000);

app.route('/owners/:owner').post(function (req, res) {
	res.json({err: 'yoyoyo!'});
	//updateWhitelist(req.params.owner, function (err) {
	//	res.json({err: err});
	//});
});

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

function mapToObject (array, key) {
	var res = {};
	for (var i = array.length - 1; i >= 0; i--) {
		res[array[i].owner] = array[i];
	}
	return res;
}

app.route('/check').get(function (req, res) {
	var dailyDate = new Date();
	dailyDate.setHours(-3, 0, 0);
	var threshold = dailyDate.getTime();
	db.all(`select owner, min(balance) as minBalance, max(balance) as maxBalance, min(paid) as minPaid, max(paid) as maxPaid from earnings where insertDate > ${threshold} AND (balance > 0 OR paid > 0) group by owner`, function (err, rows) {
		console.log(mapToObject(rows, 'owner'))
		res.render("index", {
			cache: getGroups(JSON.parse(JSON.stringify(data))),
			earnings: mapToObject(rows, 'owner')
		});
	});		
});

setInterval(function () {
	io.emit('updateEarnings', {fortunato1911: {paid: 694421926886, balance: 8839762240000}})
}, 1000)

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

server.listen(config.port, config.ip, function () {
    console.log('Server hub launched at', config.ip, config.port);
});