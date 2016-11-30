/**
 * The `RetroPie-profiles` login.sh script issues a long polling `curl`
 * command to this server, which waits for mobile devices to connect
 * and do the login logic. Once a successful login happens,
 * the user's `name` and `id` are returned to the connected login.sh curl
 * connection in the form of bash-eval-able env vars `NAME` and `ID`.
 */

const { parse } = require('url')
const snakeCase = require('snake-case')
const { EventEmitter } = require('events')
const { resolve, isAbsolute } = require('path')
const debug = require('debug')('RetroPie-profiles-server')

// emits "login" events for successful logins to the curl connection(s)
const emitter = new EventEmitter()

let filename = process.argv[3]
if (!isAbsolute(filename)) {
  filename = resolve(filename);
}

debug('entry point: %o', filename);
let mod = require(filename);
if (mod.default) mod = mod.default;

if ('function' !== typeof mod) {
  throw new TypeError(`A function must be exported. Got "${typeof mod}"`);
}

module.exports = async function (req, res) {
  res.setHeader('Connection', 'close')

  const parsed = parse(req.url)

  if ('/login' === parsed.pathname) {
    // the login.sh curl command that will wait for a login event to happen
    req.setTimeout(0)

    req.socket.once('close', () => debug('curl socket closed'))

    debug('curl command waiting for "login" event to happen')
    const login = await waitEvent(emitter, 'login')

    // return a string that bash can eval for env vars
    const env = Object.keys(login)
      .map((key) => {
        const name = snakeCase(key).toUpperCase()
        const value = JSON.stringify(login[key])
        return `export ${name}=${value}`
      })
      .join('\n')
    debug('returning env to login.sh: %o', env)
    return env

  } else {
    res.once('login', (login) => emitter.emit('login', login))
    return Promise.resolve(mod(req, res))
  }
}

function waitEvent (emitter, name) {
  return new Promise((resolve, reject) => {
    emitter.once(name, resolve)
  })
}
