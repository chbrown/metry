/// <reference path="../type_declarations/index.d.ts" />
import {logger} from 'loge';
import Router = require('regex-router');
import {db} from '../database';

const action_columns = ['action_id', 'actiontype_id', 'started', 'ended', 'deleted', 'entered'];

var R = new Router((req, res: any, m) => {
  res.die(`actions: URL not found: ${req.url}`);
});

/** GET /actions
List all actions.
*/
R.get(/^\/actions($|\?)/, (req, res: any) => {
  db.Select('action')
  .add('DISTINCT ON(action_id) *')
  .orderBy('action_id, entered DESC')
  .where('deleted IS NULL')
  .execute((err, actions) => {
    if (err) return res.die(err);
    res.json(actions);
  });
});

/** GET /actions/new
Generate blank action.
*/
R.get(/^\/actions\/new$/, (req, res: any) => {
  res.json({entered: new Date()});
});

/** POST /actions
    POST /actions/:id
Create / update action.
It's basically the same thing since the `action` table is immutable.
*/
R.post(/^\/actions(?:$|\/(\d+))/, (req: any, res: any, m) => {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var fields = _.pick(data, action_columns);
    if (m[1]) {
      fields['id'] = m[1];
    }

    db.InsertOne('action')
    .set(fields)
    .returning('*')
    .execute((err, action) => {
      if (err) return res.die(err);
      res.status(201).json(action);
    });
  });
});

/** GET /actions/:id
Show existing action.
*/
R.get(/^\/actions\/(\d+)$/, (req, res: any, m) => {
  db.SelectOne('action')
  .whereEqual({id: m[1]})
  .orderBy('entered DESC')
  .where('deleted IS NULL')
  .execute((err, action) => {
    if (err) return res.die(err);
    res.json(action);
  });
});

/** DELETE /actions/:id
Delete existing action.
*/
R.delete(/^\/actions\/(\d+)$/, (req, res: any, m) => {
  db.Insert('action')
  .set({id: m[1], deleted: new Date()})
  .execute((err) => {
    if (err) return res.die(err);
    res.status(204).end();
  });
});

export = R.route.bind(R);
