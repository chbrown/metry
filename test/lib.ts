import test from 'ava'
import {URL} from 'url'
import {request as httpRequest, ClientRequestArgs} from 'http'
import {request as httpsRequest} from 'https'

function isHttps(options: ClientRequestArgs | string | URL): boolean {
  if (typeof options == 'string') {
    return /^https/.test(options)
  }
  // ClientRequestArgs and URL both have the relevant 'protocol' field
  return options.protocol == 'https:'
}

export interface Headers {
  [header: string]: string | string[] | undefined
}

/** A fully-read version of http.IncomingMessage */
export interface Message<T = Buffer> {
  headers: Headers
  ok: boolean
  status: number
  statusText: string
  body: T
}

export class HTTPError<T> extends Error {
  public headers: Headers
  public body: T
  constructor(res: Message<T>) {
    super(`HTTP ${res.status}: ${res.statusText}`)
    this.headers = res.headers
    this.body = res.body
  }
}

/**
Send an HTTP/S request, dispatching to http/https as appropriate.
*/
export function request(options: ClientRequestArgs | string | URL): Promise<Message> {
  return new Promise<Message>((resolve, reject) => {
    const request = isHttps(options) ? httpsRequest : httpRequest
    const req = request(options, res => {
      const chunks = []
      res.on('error', err => {
        reject(err)
      })
      res.on('data', chunk => {
        chunks.push(chunk)
      })
      res.on('end', () => {
        resolve({
          headers: res.headers,
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          body: Buffer.concat(chunks),
        })
      })
    })
    req.on('error', err => {
      reject(err)
    })
    req.end()
  })
}

export function throwFailure<T extends Message>(message: T): T {
  if (!message.ok) {
    throw new HTTPError(message)
  }
  return message
}

export function parseJSON<T extends Message>(message: T): T & {body: any} {
  const body = JSON.parse(message.body.toString('utf-8'))
  return Object.assign(message, {body})
}

test('isHttps', t => {
  t.true(isHttps('https://metry.test'))
  t.false(isHttps('http://metry.test'))
})
