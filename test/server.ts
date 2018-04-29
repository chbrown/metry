import test from 'ava'
import * as Ajv from 'ajv'
import {Server} from 'restify'

import {actions, actiontypes} from './schemas'
import {request, throwFailure, parseJSON} from './lib'

import {app} from '../server'

const ajv = new Ajv()

async function startServer() {
  return new Promise<Server>((resolve, reject) => {
    app.listen(null, 'localhost', () => {
      resolve(app)
    })
  })
}

test.before(async t => {
  await startServer()
})

test('/info', async t => {
  const res = await request(`${app.url}/info`).then(throwFailure).then(parseJSON)
  t.is(res.body.name, 'metry')
  for (const key of ['name', 'version', 'description', 'homepage', 'author', 'license']) {
    t.true(key in res.body)
  }
})

test('/actions', async t => {
  const now = new Date()
  const one_week = 7 * 24 * 60 * 60 * 1000 // in milliseconds
  const one_week_ago = new Date(now.getTime() - one_week)
  const res = await request(`${app.url}/actions?start=${one_week_ago.toISOString()}`).then(throwFailure).then(parseJSON)
  t.true(res.body.length > 0)
  const validateActions = ajv.compile(actions)
  t.true(validateActions(res.body), ajv.errorsText())
})

test('/actiontypes', async t => {
  const res = await request(`${app.url}/actiontypes`).then(throwFailure).then(parseJSON)
  t.true(res.body.length > 0)
  const validateActiontypes = ajv.compile(actiontypes)
  t.true(validateActiontypes(res.body), ajv.errorsText())
})
