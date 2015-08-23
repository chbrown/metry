/// <reference path="../type_declarations/index.d.ts" />
import _ = require('lodash');
import {logger} from 'loge';
import Router = require('regex-router');
import {db} from '../database';

const actiontype_columns = ['actiontype_id', 'name', 'view_order', 'archived', 'deleted'];

var R = new Router();

/** GET /actiontypes
List all actiontypes.
*/
R.get(/^\/actiontypes($|\?)/, (req, res: any) => {
  db.Select('distinct_actiontype')
  .where('deleted IS NULL')
  .orderBy('view_order ASC, actiontype_id ASC')
  .execute((err, actiontypes) => {
    if (err) return res.die(err);
    res.json(actiontypes);
  });
});

/** GET /actiontypes/new
Generate blank actiontype.
*/
R.get(/^\/actiontypes\/new$/, (req, res: any) => {
  res.json({entered: new Date()});
});

/** POST /actiontypes
    POST /actiontypes/
    POST /actiontypes/:actiontype_id
Create / update actiontypes.
It's basically the same thing since the `actiontype` table is immutable.
*/
R.post(/^\/actiontypes(?:\/(\d+)?)?$/, (req: any, res: any, m) => {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var fields = _.pick(data, actiontype_columns);
    fields['actiontype_id'] = m[1];

    db.InsertOne('actiontype')
    .set(fields)
    .returning('*')
    .execute((err, actiontype) => {
      if (err) return res.die(err);
      res.status(201).json(actiontype);
    });
  });
});

/** GET /actiontypes/:actiontype_id
Show existing actiontype.
*/
R.get(/^\/actiontypes\/(\d+)$/, (req, res: any, m) => {
  db.SelectOne('distinct_actiontype')
  .whereEqual({actiontype_id: m[1]})
  .where('deleted IS NULL')
  .execute((err, actiontype) => {
    if (err) return res.die(err);
    res.json(actiontype);
  });
});

/** DELETE /actiontypes/:actiontype_id
Delete existing actiontype.
*/
R.delete(/^\/actiontypes\/(\d+)$/, (req, res: any, m) => {
  db.Insert('actiontype')
  .set({actiontype_id: m[1], deleted: new Date()})
  .execute((err) => {
    if (err) return res.die(err);
    res.status(204).end();
  });
});

export = R.route.bind(R);
