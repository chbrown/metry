var http = require('http-enhanced');
import {logger} from 'loge';

var indexController = require('./controllers/index');

var server = http.createServer((req, res) => {
  logger.debug('%s %s', req.method, req.url);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  indexController(req, res);
});
server.on('listening', () => {
  var address = server.address();
  logger.info(`server listening on http://${address.address}:${address.port}`);
});

export = server;
