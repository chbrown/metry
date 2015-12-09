var restify_1 = require('restify');
var database_1 = require('./database');
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
    return function (error, result) {
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
exports.app.get('info', function (req, res, next) {
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
exports.app.get('actions', function (req, res, next) {
    var select = database_1.default.Select('distinct_action').where('deleted IS NULL');
    var start = parseDate(req.params.start);
    if (start) {
        select = select.where('started > ?', start);
    }
    var end = parseDate(req.params.end);
    if (end) {
        select = select.where('ended < ?', end);
    }
    select.execute(sendCallback(res, next));
});
/** GET /actions/new
Generate blank action.
*/
exports.app.get('actions/new', function (req, res, next) {
    res.send({ entered: new Date() });
    next();
});
/** POST /actions
    POST /actions/
    POST /actions/:action_id
Create / update action.
It's basically the same thing since the `action` table is immutable.
*/
exports.app.post('actions/:action_id', function (req, res, next) {
    // the action_id supplied in the URL should override the payload, even if undefined
    // if it's the empty string, use undefined instead
    var action_id = req.params.action_id || undefined;
    var _a = req.body, actiontype_id = _a.actiontype_id, started = _a.started, ended = _a.ended, deleted = _a.deleted;
    database_1.default.InsertOne('action')
        .set({ action_id: action_id, actiontype_id: actiontype_id, started: started, ended: ended, deleted: deleted })
        .returning('*')
        .execute(sendCallback(res, next)); // HTTP 201
});
/** GET /actions/:action_id
Show existing action.
*/
exports.app.get('actions/:action_id', function (req, res, next) {
    database_1.default.SelectOne('action')
        .whereEqual({ action_id: req.params.action_id })
        .orderBy('entered DESC')
        .where('deleted IS NULL')
        .execute(sendCallback(res, next));
});
/** DELETE /actions/:action_id
Delete existing action.
*/
exports.app.del('actions/:action_id', function (req, res, next) {
    database_1.default.Insert('action')
        .set({ action_id: req.params.action_id, deleted: new Date() })
        .execute(sendCallback(res, next)); // HTTP 204
});
/*******************************************************************************
                                actiontypes
*******************************************************************************/
/** GET /actiontypes
List all actiontypes.
*/
exports.app.get('actiontypes', function (req, res, next) {
    database_1.default.Select('distinct_actiontype')
        .where('deleted IS NULL')
        .orderBy('view_order ASC, actiontype_id ASC')
        .execute(sendCallback(res, next));
});
/** GET /actiontypes/new
Generate blank actiontype.
*/
exports.app.get('actiontypes/new', function (req, res, next) {
    res.send({ entered: new Date() });
    next();
});
/** POST /actiontypes
    POST /actiontypes/
    POST /actiontypes/:actiontype_id
Create / update actiontypes.
It's basically the same thing since the `actiontype` table is immutable.
*/
exports.app.post('actiontypes/:actiontype_id', function (req, res, next) {
    // if actiontype_id in the url is the empty string, use undefined instead
    var actiontype_id = req.params.actiontype_id || undefined;
    var _a = req.body, name = _a.name, view_order = _a.view_order, archived = _a.archived, deleted = _a.deleted;
    database_1.default.InsertOne('actiontype')
        .set({ actiontype_id: actiontype_id, name: name, view_order: view_order, archived: archived, deleted: deleted })
        .returning('*')
        .execute(sendCallback(res, next)); // HTTP 201
});
/** GET /actiontypes/:actiontype_id
Show existing actiontype.
*/
exports.app.get('actiontypes/:actiontype_id', function (req, res, next) {
    database_1.default.SelectOne('distinct_actiontype')
        .whereEqual({ actiontype_id: req.params.actiontype_id })
        .where('deleted IS NULL')
        .execute(sendCallback(res, next));
});
/** DELETE /actiontypes/:actiontype_id
Delete existing actiontype.
*/
exports.app.del('actiontypes/:actiontype_id', function (req, res, next) {
    database_1.default.Insert('actiontype')
        .set({ actiontype_id: req.params.actiontype_id, deleted: new Date() })
        .execute(sendCallback(res, next)); // HTTP 204
});
exports.app.on('listening', function () {
    var address = exports.app.address();
    console.log("server listening on http://" + address.address + ":" + address.port);
});
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exports.app;
