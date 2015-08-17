/// <reference path="type_declarations/index.d.ts" />
import {logger} from 'loge';
var sqlcmd = require('sqlcmd-pg');

export var db = new sqlcmd.Connection({
  host: '127.0.0.1',
  port: '5432',
  user: 'postgres',
  database: 'metry',
});

db.on('log', function(ev) {
  var args = [ev.format].concat(ev.args);
  logger[ev.level].apply(logger, args);
});
