/// <reference path="../type_declarations/index.d.ts" />
import {logger} from 'loge';
import Router = require('regex-router');

// var send = require('send');

var package_json = require('../package.json');

var actionsController = require('./actions');
var actiontypesController = require('./actiontypes');

var R = new Router((req, res: any, m) => {
  res.end(`index: URL not found: ${req.url}`);
});

R.any(/^\/actions/, actionsController);
R.any(/^\/actiontypes/, actiontypesController);

/** GET /info
Show metry package metadata
*/
R.get(/^\/info$/, (req, res: any, m) => {
  res.json({
    name: package_json.name,
    version: package_json.version,
    description: package_json.description,
    homepage: package_json.homepage,
    author: package_json.author,
    license: package_json.license,
  });
});

export = R.route.bind(R);
