import {join} from 'path'

import * as optimist from 'optimist'
import {Pool} from 'pg'
import {createServer, Response, Next, plugins} from 'restify'

import {createDatabase, executePatches, initializeDatabase} from './database'
import {corsPreflight, corsHandler} from './middleware'

const PG_CONFIG = {
  user: 'postgres',
  host: '127.0.0.1',
  database: 'metry',
  port: 5432,
}
const pool = new Pool(PG_CONFIG)

const package_json = require('./package.json')

export const app = createServer()

// CORS
app.pre(corsPreflight)
app.use(corsHandler)
// restify plugins
app.use(plugins.queryParser({mapParams: true}))
app.use(plugins.bodyParser())

/**
Simple date parser, but returns null for invalid input.
*/
function parseDate(text: string): Date {
  const date = new Date(text)
  return isNaN(date.getTime()) ? null : date
}

/** GET /info
Show metry package metadata
*/
app.get('/info', (req, res, next) => {
  res.send({
    name: package_json.name,
    version: package_json.version,
    description: package_json.description,
    homepage: package_json.homepage,
    author: package_json.author,
    license: package_json.license,
  })
})

/*******************************************************************************
                                 actions
*******************************************************************************/
/** GET /actions
List all actions.
*/
app.get('/actions', (req, res, next) => {
  const start = parseDate(req.params.start)
  const end = parseDate(req.params.end)
  pool.query(
    `SELECT * FROM distinct_action
     WHERE deleted IS NULL
       AND ($1::TIMESTAMPTZ IS NULL OR started > $1)
       AND ($2::TIMESTAMPTZ IS NULL OR ended < $2)`,
    [start, end],
    (err, result) => {
      if (err) {
        return next(err)
      }
      if (!result.rows) {
        res.send(404, new Error('No actions found'))
        return next()
      }
      res.send(result.rows)
      return next()
    },
  )
})
/** GET /actions/new
Generate blank action.
*/
app.get('/actions/new', (req, res, next) => {
  res.send({entered: new Date()})
  next()
})
/** POST /actions
    POST /actions/
    POST /actions/:action_id
Create / update action.
It's basically the same thing since the `action` table is immutable.
*/
app.post('/actions/:action_id', (req, res, next) => {
  // the action_id supplied in the URL should override the payload, even if undefined
  // if it's the empty string, use undefined instead
  const action_id = req.params.action_id || undefined
  const {actiontype_id, started, ended, deleted} = req.body
  // this wouldn't require the COALESCE(..., next(...)) if we could easily
  // exclude the action_id from the insertion when it is NULL
  pool.query(
    `INSERT INTO action (action_id, actiontype_id, started, ended, deleted)
     VALUES (
       COALESCE($1, nextval('action_action_id_seq')),
       $2,
       $3,
       $4,
       $5)
     RETURNING *`,
    [action_id, actiontype_id, started, ended, deleted],
    (err, result) => {
      if (err) {
        return next(err)
      }
      // should respond HTTP 201 Created
      res.send(201, result.rows[0])
      return next()
    },
  )
})
/** GET /actions/:action_id
Show existing action.
*/
app.get('/actions/:action_id', (req, res, next) => {
  pool.query(
    `SELECT * FROM action
     WHERE deleted IS NULL
       AND action_id == $1
     ORDER BY entered DESC`,
    [req.params.action_id],
    (err, result) => {
      if (err) {
        return next(err)
      }
      res.send(result.rows[0])
      return next()
    },
  )
})
/** DELETE /actions/:action_id
Delete existing action.
*/
app.del('/actions/:action_id', (req, res, next) => {
  pool.query(
    `INSERT INTO action (action_id, deleted)
     VALUES ($1, $2)`,
    [req.params.action_id, new Date()],
    (err, result) => {
      if (err) {
        return next(err)
      }
      // should respond HTTP 204 No Content
      res.send(204)
      return next()
    },
  )
})

/*******************************************************************************
                                actiontypes
*******************************************************************************/

/** GET /actiontypes
List all actiontypes.
*/
app.get('/actiontypes', (req, res, next) => {
  pool.query(
    `SELECT * FROM distinct_actiontype
     WHERE deleted IS NULL
     ORDER BY view_order ASC, actiontype_id ASC`,
    (err, result) => {
      if (err) {
        return next(err)
      }
      if (!result.rows) {
        res.send(404, new Error('No actiontypes found'))
        return next()
      }
      res.send(result.rows)
      return next()
    },
  )
})
/** GET /actiontypes/new
Generate blank actiontype.
*/
app.get('/actiontypes/new', (req, res, next) => {
  res.send({entered: new Date()})
  next()
})
/** POST /actiontypes
    POST /actiontypes/
    POST /actiontypes/:actiontype_id
Create / update actiontypes.
It's basically the same thing since the `actiontype` table is immutable.
*/
app.post('/actiontypes/:actiontype_id', (req, res, next) => {
  // if actiontype_id in the url is the empty string, use undefined instead
  const actiontype_id = req.params.actiontype_id || undefined
  const {name, view_order, archived, deleted} = req.body
  pool.query(
    `INSERT INTO actiontype (actiontype_id, name, view_order, archived, deleted)
     VALUES (
       COALESCE($1, nextval('actiontype_actiontype_id_seq')),
       $2,
       COALESCE($3, 0),
       COALESCE($4, FALSE),
       $5)
     RETURNING *`,
    [actiontype_id, name, view_order, archived, deleted],
    (err, result) => {
      if (err) {
        return next(err)
      }
      // should respond HTTP 201 Created
      res.send(201, result.rows[0])
      return next()
    },
  )
})
/** GET /actiontypes/:actiontype_id
Show existing actiontype.
*/
app.get('/actiontypes/:actiontype_id', (req, res, next) => {
  pool.query(
    `SELECT * FROM distinct_actiontype
     WHERE deleted IS NULL
       AND actiontype_id == $1
     ORDER BY entered DESC`,
    [req.params.actiontype_id],
    (err, result) => {
      if (err) {
        return next(err)
      }
      res.send(result.rows[0])
      return next()
    },
  )
})
/** DELETE /actiontypes/:actiontype_id
Delete existing actiontype.
*/
app.del('/actiontypes/:actiontype_id', (req, res, next) => {
  pool.query(
    `INSERT INTO actiontype (actiontype_id, deleted)
     VALUES ($1, $2)`,
    [req.params.actiontype_id, new Date()],
    (err, result) => {
      if (err) {
        return next(err)
      }
      // should respond HTTP 204 No Content
      res.send(204)
      return next()
    },
  )
})

app.on('listening', () => {
  const address = app.address()
  const addressString = typeof address == 'string' ? address : `${address.address}:${address.port}`
  console.log(`server listening on http://${addressString}`)
})

function main() {
  const argvparser = optimist
    .describe({
      hostname: 'hostname to listen on',
      port: 'port to listen on',
      help: 'print this help message',
      verbose: 'print extra output',
      version: 'print version',
    })
    .boolean(['help', 'verbose', 'version'])
    .alias({
      v: 'verbose',
    })
    .default({
      hostname: process.env.HOSTNAME || '127.0.0.1',
      port: parseInt(process.env.PORT, 10) || 80,
      verbose: process.env.DEBUG !== undefined,
    })

  const argv = argvparser.argv

  if (argv.help) {
    argvparser.showHelp()
  } else if (argv.version) {
    console.log(package_json.version)
  } else {
    app.listen(argv.port, argv.hostname)
    const patches_dirpath = join(__dirname, 'schema')
    initializeDatabase(PG_CONFIG, patches_dirpath, err => {
      if (err) throw err
      console.info('initialized database successfully')
    })
  }
}

if (require.main === module) {
  main()
}
