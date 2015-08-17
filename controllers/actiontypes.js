/// <reference path="../type_declarations/index.d.ts" />
var _ = require('lodash');
var loge_1 = require('loge');
var Router = require('regex-router');
var database_1 = require('../database');
var actiontype_columns = ['actiontype_id', 'name', 'view_order', 'archived', 'created'];
var R = new Router(function (req, res, m) {
    res.die("actiontypes: URL not found: " + req.url);
});
/** GET /actiontypes
List all actiontypes.
*/
R.get(/^\/actiontypes($|\?)/, function (req, res) {
    database_1.db.Select('actiontype')
        .execute(function (err, rows) {
        if (err)
            return res.die(err);
        res.json(rows);
    });
});
/** GET /actiontypes/new
Generate blank actiontype.
*/
R.get(/^\/actiontypes\/new$/, function (req, res) {
    res.json({ created: new Date() });
});
/** POST /actiontypes
Create new actiontype.
*/
R.post(/^\/actiontypes($|\?)/, function (req, res) {
    req.readData(function (err, data) {
        if (err)
            return res.die(err);
        var fields = _.pick(data, actiontype_columns);
        database_1.db.InsertOne('actiontype')
            .set(fields)
            .returning('*')
            .execute(function (err, actiontype) {
            if (err)
                return res.die(err);
            res.status(201).json(actiontype);
        });
    });
});
/** GET /actiontypes/:id
Show existing actiontype.
*/
R.get(/^\/actiontypes\/(\d+)$/, function (req, res, m) {
    database_1.db.SelectOne('actiontype')
        .whereEqual({ id: m[1] })
        .execute(function (err, actiontype) {
        if (err)
            return res.die(err);
        res.json(actiontype);
    });
});
/** POST /actiontypes
Update existing actiontype.
*/
R.post(/^\/actiontypes\/(\d+)/, function (req, res, m) {
    req.readData(function (err, data) {
        if (err)
            return res.die(err);
        var fields = _.pick(data, actiontype_columns);
        database_1.db.Update('actiontype')
            .setEqual(fields)
            .whereEqual({ id: m[1] })
            .returning('*')
            .execute(function (err, rows) {
            if (err)
                return res.die(err);
            res.status(201).json(rows[0]);
        });
    });
});
/** DELETE /actiontypes/:id
Delete existing actiontype.
*/
R.delete(/^\/actiontypes\/(\d+)$/, function (req, res, m) {
    database_1.db.Delete('actiontype')
        .whereEqual({ id: m[1] })
        .execute(function (err) {
        if (err)
            return res.die(err);
        res.status(204).end();
    });
});
function route(req, res) {
    loge_1.logger.debug('actiontypes routing: ', req.method, req.url);
    R.route(req, res);
}
module.exports = route;
// export = R.route.bind(R);
