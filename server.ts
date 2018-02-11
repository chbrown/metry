import {join} from 'path'
import * as optimist from 'optimist'
import {createServer, bodyParser, queryParser, CORS, Response, Next} from 'restify'
import {Connection} from 'sqlcmd-pg'
import {executePatches} from 'sql-patch'

export const db = new Connection({
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  database: 'metry',
})

const package_json = require('./package.json')

export const app = createServer()

app.use(CORS())
app.use(queryParser())
// keep req.params and req.body distinct, so that we can distingush between POST and url params
app.use(bodyParser({mapParams: false}))

/**
Simple date parser, but returns null for invalid input.
*/
function parseDate(text: string): Date {
  const date = new Date(text)
  return isNaN(date.getTime()) ? null : date
}

function sendCallback(res: Response, next: Next) {
  return (error: Error, result?: any) => {
    if (error) {
      return next(error)
    }
    if (result === undefined) {
      res.send(404, new Error('No results found'))
      return next()
    }
    res.send(result)
    return next()
  }
}

/** GET /info
Show metry package metadata
*/
app.get('info', (req, res, next) => {
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
app.get('actions', (req, res, next) => {
  let select = db.Select('distinct_action').where('deleted IS NULL')

  let start = parseDate(req.params.start)
  if (start) {
    select = select.where('started > ?', start)
  }
  let end = parseDate(req.params.end)
  if (end) {
    select = select.where('ended < ?', end)
  }

  select.execute(sendCallback(res, next))
})
/** GET /actions/new
Generate blank action.
*/
app.get('actions/new', (req, res, next) => {
  res.send({entered: new Date()})
  next()
})
/** POST /actions
    POST /actions/
    POST /actions/:action_id
Create / update action.
It's basically the same thing since the `action` table is immutable.
*/
app.post('actions/:action_id', (req, res, next) => {
  // the action_id supplied in the URL should override the payload, even if undefined
  // if it's the empty string, use undefined instead
  let action_id = req.params.action_id || undefined
  let {actiontype_id, started, ended, deleted} = req.body

  db.InsertOne('action')
  .set({action_id, actiontype_id, started, ended, deleted})
  .returning('*')
  .execute(sendCallback(res, next)) // HTTP 201
})
/** GET /actions/:action_id
Show existing action.
*/
app.get('actions/:action_id', (req, res, next) => {
  db.SelectOne('action')
  .whereEqual({action_id: req.params.action_id})
  .orderBy('entered DESC')
  .where('deleted IS NULL')
  .execute(sendCallback(res, next))
})
/** DELETE /actions/:action_id
Delete existing action.
*/
app.del('actions/:action_id', (req, res, next) => {
  db.Insert('action')
  .set({action_id: req.params.action_id, deleted: new Date()})
  .execute(sendCallback(res, next)) // HTTP 204
})


/*******************************************************************************
                                actiontypes
*******************************************************************************/

/** GET /actiontypes
List all actiontypes.
*/
app.get('actiontypes', (req, res, next) => {
  db.Select('distinct_actiontype')
  .where('deleted IS NULL')
  .orderBy('view_order ASC, actiontype_id ASC')
  .execute(sendCallback(res, next))
})
/** GET /actiontypes/new
Generate blank actiontype.
*/
app.get('actiontypes/new', (req, res, next) => {
  res.send({entered: new Date()})
  next()
})
/** POST /actiontypes
    POST /actiontypes/
    POST /actiontypes/:actiontype_id
Create / update actiontypes.
It's basically the same thing since the `actiontype` table is immutable.
*/
app.post('actiontypes/:actiontype_id', (req, res, next) => {
  // if actiontype_id in the url is the empty string, use undefined instead
  let actiontype_id = req.params.actiontype_id || undefined
  let {name, view_order, archived, deleted} = req.body

  db.InsertOne('actiontype')
  .set({actiontype_id, name, view_order, archived, deleted})
  .returning('*')
  .execute(sendCallback(res, next)) // HTTP 201
})
/** GET /actiontypes/:actiontype_id
Show existing actiontype.
*/
app.get('actiontypes/:actiontype_id', (req, res, next) => {
  db.SelectOne('distinct_actiontype')
  .whereEqual({actiontype_id: req.params.actiontype_id})
  .where('deleted IS NULL')
  .execute(sendCallback(res, next))
})
/** DELETE /actiontypes/:actiontype_id
Delete existing actiontype.
*/
app.del('actiontypes/:actiontype_id', (req, res, next) => {
  db.Insert('actiontype')
  .set({actiontype_id: req.params.actiontype_id, deleted: new Date()})
  .execute(sendCallback(res, next)) // HTTP 204
})

app.on('listening', () => {
  const address = app.address()
  console.log(`server listening on http://${address.address}:${address.port}`)
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
    .boolean([
      'help',
      'verbose',
      'version',
    ])
    .alias({
      v: 'verbose',
    })
    .default({
      hostname: process.env.HOSTNAME || '127.0.0.1',
      port: parseInt(process.env.PORT) || 80,
      verbose: process.env.DEBUG !== undefined,
    })

  const argv = argvparser.argv

  if (argv.help) {
    argvparser.showHelp()
  }
  else if (argv.version) {
    console.log(package_json.version)
  }
  else {
    console.info('starting metry server; initializing database if needed')
    db.createDatabaseIfNotExists(err => {
      if (err) throw err

      const patches_dirpath = join(__dirname, 'schema')
      executePatches(db, '_schema_patches', patches_dirpath, err => {
        if (err) throw err

        app.listen(argv.port, argv.hostname)
      })
    })
  }
}

if (require.main === module) {
  main()
}
