var loge_1 = require('loge');
var regex_router_1 = require('regex-router');
var package_json = require('../package.json');
var actionsController = require('./actions');
var actiontypesController = require('./actiontypes');
var R = new regex_router_1.default(function (req, res, m) {
    res.end("index: URL not found: " + req.url);
});
R.options(/^\//, function (req, res, m) {
    loge_1.logger.debug('Responding to OPTIONS /*');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
    res.end();
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
