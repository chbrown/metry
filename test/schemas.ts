import test from 'ava'
import * as Ajv from 'ajv'

const ajv = new Ajv()

export const action = {
  type: 'object',
  properties: {
    action_id: {type: 'number'},
    actiontype_id: {type: 'number'},
    started: {type: 'string'},
    ended: {type: 'string'},
    deleted: {type: 'null'},
    entered: {type: 'string'},
  },
  required: ['action_id', 'actiontype_id', 'started', 'ended', 'deleted', 'entered'],
}

export const actions = {
  type: 'array',
  items: action,
}

export const actiontype = {
  type: 'object',
  properties: {
    actiontype_id: {type: 'number'},
    name: {type: 'string'},
    view_order: {type: 'number'},
    archived: {type: 'boolean'},
    deleted: {type: 'null'},
    entered: {type: 'string'},
  },
  required: ['actiontype_id', 'name', 'view_order', 'archived', 'deleted', 'entered'],
}

export const actiontypes = {
  type: 'array',
  items: actiontype,
}

test('schemas', t => {
  for (const schema of [action, actions, actiontype, actiontypes]) {
    const isValid = ajv.validateSchema(schema)
    t.true(isValid, ajv.errorsText())
  }
})
