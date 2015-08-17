/// <reference path="type_declarations/index.d.ts" />
var http = require('http-enhanced');
var loge_1 = require('loge');
var indexController = require('./controllers/index');
var server = http.createServer(function (req, res) {
    loge_1.logger.debug('%s %s', req.method, req.url);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    indexController(req, res);
});
server.on('listening', function () {
    var address = server.address();
    loge_1.logger.info("server listening on http://" + address.address + ":" + address.port);
});
module.exports = server;
