var Router = require('regex-router');
// var send = require('send');
var package_json = require('../package.json');
var actionsController = require('./actions');
var actiontypesController = require('./actiontypes');
var R = new Router(function (req, res, m) {
    res.end("index: URL not found: " + req.url);
});
R.any(/^\/actions/, actionsController);
R.any(/^\/actiontypes/, actiontypesController);
/** GET /info
Show metry package metadata
*/
R.get(/^\/info$/, function (req, res, m) {
    res.json({
        name: package_json.name,
        version: package_json.version,
        description: package_json.description,
        homepage: package_json.homepage,
        author: package_json.author,
        license: package_json.license,
    });
});
module.exports = R.route.bind(R);
