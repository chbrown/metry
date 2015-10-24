import {pick} from 'lodash';
import {logger} from 'loge';
import Router from 'regex-router';
import db from '../database';

const action_columns = ['action_id', 'actiontype_id', 'started', 'ended', 'deleted'];

var R = new Router();

/** GET /actions
List all actions.
*/
R.get(/^\/actions($|\?)/, (req, res: any) => {
  db.Select('distinct_action')
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
    POST /actions/
    POST /actions/:action_id
Create / update action.
It's basically the same thing since the `action` table is immutable.
*/
R.post(/^\/actions(?:\/(\d+)?)?$/, (req: any, res: any, m) => {
  req.readData(function(err, data) {
    if (err) return res.die(err);

    var fields = pick(data, action_columns);
    // the action_id supplied in the URL should override the payload, even if undefined
    fields['action_id'] = m[1];

    db.InsertOne('action')
    .set(fields)
    .returning('*')
    .execute((err, action) => {
      if (err) return res.die(err);
      res.status(201).json(action);
    });
  });
});

/** GET /actions/:action_id
Show existing action.
*/
R.get(/^\/actions\/(\d+)$/, (req, res: any, m) => {
  db.SelectOne('action')
  .whereEqual({action_id: m[1]})
  .orderBy('entered DESC')
  .where('deleted IS NULL')
  .execute((err, action) => {
    if (err) return res.die(err);
    res.json(action);
  });
});

/** DELETE /actions/:action_id
Delete existing action.
*/
R.delete(/^\/actions\/(\d+)$/, (req, res: any, m) => {
  db.Insert('action')
  .set({action_id: m[1], deleted: new Date()})
  .execute((err) => {
    if (err) return res.die(err);
    res.status(204).end();
  });
});

export = R.route.bind(R);
