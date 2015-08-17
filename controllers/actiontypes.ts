/// <reference path="../type_declarations/index.d.ts" />
import _ = require('lodash');
import {logger} from 'loge';
import Router = require('regex-router');
import {db} from '../database';

const actiontype_columns = ['actiontype_id', 'name', 'view_order', 'archived', 'created'];

var R = new Router((req, res: any, m) => {
  res.die(`actiontypes: URL not found: ${req.url}`);
});

/** GET /actiontypes
List all actiontypes.
*/
R.get(/^\/actiontypes($|\?)/, (req, res: any) => {
  db.Select('actiontype')
  .execute((err, rows) => {
    if (err) return res.die(err);
    res.json(rows);
  });
});

/** GET /actiontypes/new
Generate blank actiontype.
*/
R.get(/^\/actiontypes\/new$/, (req, res: any) => {
  res.json({created: new Date()});
});

/** POST /actiontypes
Create new actiontype.
*/
R.post(/^\/actiontypes($|\?)/, (req: any, res: any) => {
  req.readData((err, data) => {
    if (err) return res.die(err);

    var fields = _.pick(data, actiontype_columns);

    db.InsertOne('actiontype')
    .set(fields)
    .returning('*')
    .execute((err, actiontype) => {
      if (err) return res.die(err);
      res.status(201).json(actiontype);
    });
  });
});

/** GET /actiontypes/:id
Show existing actiontype.
*/
R.get(/^\/actiontypes\/(\d+)$/, (req, res: any, m) => {
  db.SelectOne('actiontype')
  .whereEqual({id: m[1]})
  .execute((err, actiontype) => {
    if (err) return res.die(err);
    res.json(actiontype);
  });
});

/** POST /actiontypes
Update existing actiontype.
*/
R.post(/^\/actiontypes\/(\d+)/, (req: any, res: any, m) => {
  req.readData((err, data) => {
    if (err) return res.die(err);

    var fields = _.pick(data, actiontype_columns);

    db.Update('actiontype')
    .setEqual(fields)
    .whereEqual({id: m[1]})
    .returning('*')
    .execute((err, rows) => {
      if (err) return res.die(err);
      res.status(201).json(rows[0]);
    });
  });
});

/** DELETE /actiontypes/:id
Delete existing actiontype.
*/
R.delete(/^\/actiontypes\/(\d+)$/, (req, res: any, m) => {
  db.Delete('actiontype')
  .whereEqual({id: m[1]})
  .execute((err) => {
    if (err) return res.die(err);
    res.status(204).end();
  });
});

function route(req, res) {
  logger.debug('actiontypes routing: ', req.method, req.url);
  R.route(req, res);
}
export = route;
// export = R.route.bind(R);
