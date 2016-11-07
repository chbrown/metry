"use strict";
const restify_1 = require('restify');
const sqlcmd_pg_1 = require('sqlcmd-pg');
exports.db = new sqlcmd_pg_1.Connection({
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    database: 'metry',
});
var package_json = require('./package.json');
exports.app = restify_1.createServer();
exports.app.use(restify_1.CORS());
exports.app.use(restify_1.queryParser());
// keep req.params and req.body distinct, so that we can distingush between POST and url params
exports.app.use(restify_1.bodyParser({ mapParams: false }));
/**
Simple date parser, but returns null for invalid input.
*/
function parseDate(text) {
    var date = new Date(text);
    return isNaN(date.getTime()) ? null : date;
}
function sendCallback(res, next) {
    return (error, result) => {
        if (error) {
            return next(error);
        }
        if (result === undefined) {
            res.send(404, new Error('No results found'));
            return next();
        }
        res.send(result);
        return next();
    };
}
/** GET /info
Show metry package metadata
*/
exports.app.get('info', (req, res, next) => {
    res.send({
        name: package_json.name,
        version: package_json.version,
        description: package_json.description,
        homepage: package_json.homepage,
        author: package_json.author,
        license: package_json.license,
    });
});
/*******************************************************************************
                                 actions
*******************************************************************************/
/** GET /actions
List all actions.
*/
exports.app.get('actions', (req, res, next) => {
    let select = exports.db.Select('distinct_action').where('deleted IS NULL');
    let start = parseDate(req.params.start);
    if (start) {
        select = select.where('started > ?', start);
    }
    let end = parseDate(req.params.end);
    if (end) {
        select = select.where('ended < ?', end);
    }
    select.execute(sendCallback(res, next));
});
/** GET /actions/new
Generate blank action.
*/
exports.app.get('actions/new', (req, res, next) => {
    res.send({ entered: new Date() });
    next();
});
/** POST /actions
    POST /actions/
    POST /actions/:action_id
Create / update action.
It's basically the same thing since the `action` table is immutable.
*/
exports.app.post('actions/:action_id', (req, res, next) => {
    // the action_id supplied in the URL should override the payload, even if undefined
    // if it's the empty string, use undefined instead
    let action_id = req.params.action_id || undefined;
    let { actiontype_id, started, ended, deleted } = req.body;
    exports.db.InsertOne('action')
        .set({ action_id, actiontype_id, started, ended, deleted })
        .returning('*')
        .execute(sendCallback(res, next)); // HTTP 201
});
/** GET /actions/:action_id
Show existing action.
*/
exports.app.get('actions/:action_id', (req, res, next) => {
    exports.db.SelectOne('action')
        .whereEqual({ action_id: req.params.action_id })
        .orderBy('entered DESC')
        .where('deleted IS NULL')
        .execute(sendCallback(res, next));
});
/** DELETE /actions/:action_id
Delete existing action.
*/
exports.app.del('actions/:action_id', (req, res, next) => {
    exports.db.Insert('action')
        .set({ action_id: req.params.action_id, deleted: new Date() })
        .execute(sendCallback(res, next)); // HTTP 204
});
/*******************************************************************************
                                actiontypes
*******************************************************************************/
/** GET /actiontypes
List all actiontypes.
*/
exports.app.get('actiontypes', (req, res, next) => {
    exports.db.Select('distinct_actiontype')
        .where('deleted IS NULL')
        .orderBy('view_order ASC, actiontype_id ASC')
        .execute(sendCallback(res, next));
});
/** GET /actiontypes/new
Generate blank actiontype.
*/
exports.app.get('actiontypes/new', (req, res, next) => {
    res.send({ entered: new Date() });
    next();
});
/** POST /actiontypes
    POST /actiontypes/
    POST /actiontypes/:actiontype_id
Create / update actiontypes.
It's basically the same thing since the `actiontype` table is immutable.
*/
exports.app.post('actiontypes/:actiontype_id', (req, res, next) => {
    // if actiontype_id in the url is the empty string, use undefined instead
    let actiontype_id = req.params.actiontype_id || undefined;
    let { name, view_order, archived, deleted } = req.body;
    exports.db.InsertOne('actiontype')
        .set({ actiontype_id, name, view_order, archived, deleted })
        .returning('*')
        .execute(sendCallback(res, next)); // HTTP 201
});
/** GET /actiontypes/:actiontype_id
Show existing actiontype.
*/
exports.app.get('actiontypes/:actiontype_id', (req, res, next) => {
    exports.db.SelectOne('distinct_actiontype')
        .whereEqual({ actiontype_id: req.params.actiontype_id })
        .where('deleted IS NULL')
        .execute(sendCallback(res, next));
});
/** DELETE /actiontypes/:actiontype_id
Delete existing actiontype.
*/
exports.app.del('actiontypes/:actiontype_id', (req, res, next) => {
    exports.db.Insert('actiontype')
        .set({ actiontype_id: req.params.actiontype_id, deleted: new Date() })
        .execute(sendCallback(res, next)); // HTTP 204
});
exports.app.on('listening', () => {
    var address = exports.app.address();
    console.log(`server listening on http://${address.address}:${address.port}`);
});
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exports.app;
