/// <reference path="../type_declarations/index.d.ts" />
var _ = require('lodash');
var Router = require('regex-router');
var database_1 = require('../database');
var actiontype_columns = ['actiontype_id', 'name', 'view_order', 'archived', 'deleted'];
var R = new Router();
/** GET /actiontypes
List all actiontypes.
*/
R.get(/^\/actiontypes($|\?)/, function (req, res) {
    database_1.db.Select('distinct_actiontype')
        .where('deleted IS NULL')
        .orderBy('view_order ASC, actiontype_id ASC')
        .execute(function (err, actiontypes) {
        if (err)
            return res.die(err);
        res.json(actiontypes);
    });
});
/** GET /actiontypes/new
Generate blank actiontype.
*/
R.get(/^\/actiontypes\/new$/, function (req, res) {
    res.json({ entered: new Date() });
});
/** POST /actiontypes
    POST /actiontypes/
    POST /actiontypes/:actiontype_id
Create / update actiontypes.
It's basically the same thing since the `actiontype` table is immutable.
*/
R.post(/^\/actiontypes(?:\/(\d+)?)?$/, function (req, res, m) {
    req.readData(function (err, data) {
        if (err)
            return res.die(err);
        var fields = _.pick(data, actiontype_columns);
        fields['actiontype_id'] = m[1];
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
/** GET /actiontypes/:actiontype_id
Show existing actiontype.
*/
R.get(/^\/actiontypes\/(\d+)$/, function (req, res, m) {
    database_1.db.SelectOne('distinct_actiontype')
        .whereEqual({ actiontype_id: m[1] })
        .where('deleted IS NULL')
        .execute(function (err, actiontype) {
        if (err)
            return res.die(err);
        res.json(actiontype);
    });
});
/** DELETE /actiontypes/:actiontype_id
Delete existing actiontype.
*/
R.delete(/^\/actiontypes\/(\d+)$/, function (req, res, m) {
    database_1.db.Insert('actiontype')
        .set({ actiontype_id: m[1], deleted: new Date() })
        .execute(function (err) {
        if (err)
            return res.die(err);
        res.status(204).end();
    });
});
module.exports = R.route.bind(R);
