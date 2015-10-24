var lodash_1 = require('lodash');
var regex_router_1 = require('regex-router');
var database_1 = require('../database');
var action_columns = ['action_id', 'actiontype_id', 'started', 'ended', 'deleted'];
var R = new regex_router_1.default();
/** GET /actions
List all actions.
*/
R.get(/^\/actions($|\?)/, function (req, res) {
    database_1.default.Select('distinct_action')
        .where('deleted IS NULL')
        .execute(function (err, actions) {
        if (err)
            return res.die(err);
        res.json(actions);
    });
});
/** GET /actions/new
Generate blank action.
*/
R.get(/^\/actions\/new$/, function (req, res) {
    res.json({ entered: new Date() });
});
/** POST /actions
    POST /actions/
    POST /actions/:action_id
Create / update action.
It's basically the same thing since the `action` table is immutable.
*/
R.post(/^\/actions(?:\/(\d+)?)?$/, function (req, res, m) {
    req.readData(function (err, data) {
        if (err)
            return res.die(err);
        var fields = lodash_1.pick(data, action_columns);
        // the action_id supplied in the URL should override the payload, even if undefined
        fields['action_id'] = m[1];
        database_1.default.InsertOne('action')
            .set(fields)
            .returning('*')
            .execute(function (err, action) {
            if (err)
                return res.die(err);
            res.status(201).json(action);
        });
    });
});
/** GET /actions/:action_id
Show existing action.
*/
R.get(/^\/actions\/(\d+)$/, function (req, res, m) {
    database_1.default.SelectOne('action')
        .whereEqual({ action_id: m[1] })
        .orderBy('entered DESC')
        .where('deleted IS NULL')
        .execute(function (err, action) {
        if (err)
            return res.die(err);
        res.json(action);
    });
});
/** DELETE /actions/:action_id
Delete existing action.
*/
R.delete(/^\/actions\/(\d+)$/, function (req, res, m) {
    database_1.default.Insert('action')
        .set({ action_id: m[1], deleted: new Date() })
        .execute(function (err) {
        if (err)
            return res.die(err);
        res.status(204).end();
    });
});
module.exports = R.route.bind(R);
