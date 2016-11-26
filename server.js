/**
 * The `RetroPie-profiles` login.sh script issues a long polling `curl`
 * command to this server, which waits for mobile devices to connect
 * and do the Facebook OAuth dance. Once a successful login happens,
 * the user's name and fb id are returned to the connected login.sh curl
 * connection in the form of bash-eval-able env vars `FB_NAME` and `FB_ID`.
 */

const qs = require('querystring')
const fetch = require('node-fetch')
const { parse, format } = require('url')
const { EventEmitter } = require('events')
const { Redirect } = require('n8-server')
const debug = require('debug')('RetroPie-profiles-server')

const client_id = process.env.FACEBOOK_CLIENT_ID
const client_secret = process.env.FACEBOOK_CLIENT_SECRET;
const redirect_uri = process.env.FACEBOOK_REDIRECT_URI

// emits "login" events for successful FB logins
const emitter = new EventEmitter()

module.exports = async function (req, res) {
  const parsed = parse(req.url, true)

  if ('/login' === parsed.pathname) {
    // the login.sh curl command that will wait for a login event to happen
    req.setTimeout(0)

    const login = await waitEvent(emitter, 'login')

    // return a string that bash can eval for env vars
    const env = Object.keys(login)
      .map((key) => `export FB_${key.toUpperCase()}=${JSON.stringify(login[key])}`)
      .join('\n')
    debug('returning env to login.sh: %o', env)
    return env

  } else if ('/callback' === parsed.pathname) {
    // Facebook OAuth dialog callback
    if (parsed.query.error) {
      throw new OAuthError(parsed.query.error)
    }

    const login = await facebookLogin(parsed.query.code, {
      client_id,
      client_secret,
      redirect_uri
    })
    debug('login: %o', login)

    const r = await fbreq('/me', login.access_token)
    const me = await r.json()
    debug('me: %o', me)

    emitter.emit('login', me)

    res.setHeader('Content-Type', 'text/plain; charset=utf8')
    return `Logged in as ${me.name}. Play 🕹`

  } else {
    // otherwise it's a user using a web browser initiating a login
    const url = facebookOAuthDialogURL({
      client_id,
      redirect_uri
    })
    throw new Redirect(url)
  }
}

function waitEvent (emitter, name) {
  return new Promise((resolve, reject) => {
    emitter.once(name, resolve)
  })
}

function facebookOAuthDialogURL(query) {
  const parsed = parse('https://www.facebook.com/v2.7/dialog/oauth')
  parsed.query = query
  const url = format(parsed)
  debug('facebook login dialog URL: %o', url)
  return url
}

async function facebookLogin(code, params) {
  const query = Object.assign({ code }, params)
  const url = `https://graph.facebook.com/v2.7/oauth/access_token?${ qs.stringify(query) }`
  debug('facebook access token URL: %o', url)

  const res = await fetch(url)
  const body = await res.json()
  if (body.error) {
    throw new OAuthError(body.error)
  } else {
    return body
  }
}

function fbreq(path, access_token, ...extras) {
  const query = { access_token }
  const url = `https://graph.facebook.com/v2.7${path}?${ qs.stringify(query) }`
  debug('facebook request %o', path)
  return fetch(url, ...extras)
}

class OAuthError extends Error {
  constructor(err) {
    super()
    this.name = err.type
    Object.assign(this, err)
  }
}
