/// <reference path="type_declarations/index.d.ts" />
var loge_1 = require('loge');
var sqlcmd = require('sqlcmd-pg');
exports.db = new sqlcmd.Connection({
    host: '127.0.0.1',
    port: '5432',
    user: 'postgres',
    database: 'metry',
});
exports.db.on('log', function (ev) {
    var args = [ev.format].concat(ev.args);
    loge_1.logger[ev.level].apply(loge_1.logger, args);
});
