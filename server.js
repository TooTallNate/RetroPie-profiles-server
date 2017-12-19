/**
 * The `RetroPie-profiles` login.sh script issues a long polling `curl`
 * command to this server, which waits for mobile devices to connect
 * and do the login logic. Once a successful login happens,
 * the user's `name` and `id` are returned to the connected login.sh curl
 * connection in the form of bash-eval-able env vars `NAME` and `ID`.
 */

const { parse } = require('url')
const snakeCase = require('snake-case')
const debug = require('debug')('RetroPie-profiles-server')

module.exports = setup

function setup(fn) {
  let connections = new Set()

  function doLogin(login) {
    const env = Object.keys(login)
      .map(key => {
        const name = snakeCase(key).toUpperCase()
        const value = JSON.stringify(login[key])
        return `export ${name}=${value}`
      })
      .join('\n')
    debug('login env:')
    debug(env)

    if (connections.size === 0) {
      return false
    }

    const hostnames = new Set()

    for (const res of connections) {
      hostnames.add(res.hostname)
      res.setHeader('Content-Type', 'text/plain')
      res.statusCode = 200
      res.end(env)
    }

    connections = new Set()

    return Array.from(hostnames)
  }

  return async function retropieProfiles(req, res) {
    res.setHeader('Connection', 'close')

    const parsed = parse(req.url, true)

    if ('/login' === parsed.pathname) {
      const { hostname } = parsed.query
      if (!hostname) {
        res.statusCode = 500
        return {
          error: '`hostname` query parameter is required'
        }
      }

      // the login.sh curl command that will wait for `doLogin()` to be called
      req.setTimeout(0)

      req.socket.once('close', () => {
        debug('login window for %o closed', hostname)
        connections.delete(res)
      })

      debug('login window for %o connected', hostname)
      connections.add(res)
      res.hostname = hostname
    } else {
      const args = Array.from(arguments)
      args.push(doLogin)
      return Promise.resolve(fn.apply(this, args))
    }
  }
}
