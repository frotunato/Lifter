var express = require('express');
var app = express();
var server = require('http').createServer(app);
var config = {port: process.env.OPENSHIFT_NODEJS_PORT, ip: process.env.OPENSHIFT_NODEJS_IP};
var bodyParser = require('body-parser');
var compress = require('compression');

var cache = [];

app.use(compress())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.route('/lifter')
	.post(function (req, res) {
		var date = new Date();
		var sourceTimestamp = date.toUTCString();
		if (cache.length === 0) {
			cache.push({
				account: req.body.account,
				project: req.body.project,
				instance: req.body.instance,
				status: req.body.status,
				time: sourceTimestamp
			});
		} else {
			var found = false;
			for (var i = cache.length - 1; i >= 0; i--) {
				if (cache[i].account === req.body.account && cache[i].project === req.body.project && cache[i].instance === req.body.instance) {
					cache[i].status = req.body.status;
					cache[i].time = sourceTimestamp;
					found = true;
					break;
				}
			}
			if (!found) {
				cache.push({
					account: req.body.account,
					project: req.body.project,
					instance: req.body.instance,
					status: req.body.status,
					time: sourceTimestamp
				});
			}
		}
		res.status(200).end();
	});

app.route('/status')
	.get(function (req, res) {
		if (cache.length === 0) {
			res.json({err: 'empty'}).end();
		} else {
			res.json({cache: cache}).end();
		}
	});

server.listen(config.port, config.ip, function () {
    console.log('Server hub launched at', config.ip, config.port);
});

function generateHTML (data, timestamp) {
	var list = '<div>Last updated: ' + timestamp +'</div><ul>';
	for (var i = data.length - 1; i >= 0; i--) {
		list += '<li>' + data[i].name + '</li>';
	}
	list += '</ul>';
	return list;
}