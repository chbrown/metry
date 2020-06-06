import {Request, Response, Next} from 'restify'

/**
CORS middleware

The restify.RequestHandler instances below are based on restify-cors-middleware
(https://github.com/Tabcorp/restify-cors-middleware)

CORS-safelisted request headers:
  Accept, Accept-Language, Content-Language, Content-Type
CORS-safelisted response headers:
  Cache-Control, Content-Language, Content-Length, Content-Type, Expires, Last-Modified, Pragma
*/
const PREFLIGHT_MAX_AGE = 86400 // = 24 hours
const CREDENTIALS = false
const ORIGINS = new Set(['http://localhost', 'https://localhost'])
const ALLOW_HEADERS = ['User-Agent', 'X-Requested-With', 'Range']
const EXPOSE_HEADERS = ['Content-Range', 'Date']

export function corsPreflight(req: Request, res: Response, next: Next) {
  if (req.method !== 'OPTIONS') return next()

  const origin = req.header('Origin')
  if (!ORIGINS.has(origin)) return next()

  const requestMethod = req.header('Access-Control-Request-Method')
  if (!requestMethod) return next()

  res.once('header', () => {
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Credentials', CREDENTIALS)
    res.header('Access-Control-Max-Age', PREFLIGHT_MAX_AGE)
    res.header('Access-Control-Allow-Methods', [requestMethod, 'OPTIONS'].join(', '))
    res.header('Access-Control-Allow-Headers', ALLOW_HEADERS.join(', '))
  })
  res.send(204) // HTTP "204 No Content"
}

export function corsHandler(req: Request, res: Response, next: Next) {
  const origin = req.header('Origin')
  if (!ORIGINS.has(origin)) return next()

  res.header('Access-Control-Allow-Origin', origin)
  res.header('Vary', 'Origin')
  res.header('Access-Control-Allow-Credentials', CREDENTIALS)
  res.header('Access-Control-Expose-Headers', EXPOSE_HEADERS.join(', '))

  return next()
}
