/**
 * The `RetroPie-profiles` login.sh script issues a long polling `curl`
 * command to this server, which waits for mobile devices to connect
 * and do the login logic. Once a successful login happens,
 * the user's `name` and `id` are returned to the connected login.sh curl
 * connection in the form of bash-eval-able env vars `NAME` and `ID`.
 */

const { parse } = require('url')
const debug = require('debug')('RetroPie-profiles-server')

module.exports = setup

function setup(fn) {
  let hostnames = new Set()
  let connections = new Set()

  function doLogin(login) {
    debug('doLogin(%o)', login)

    if (connections.size === 0) {
      return false
    }

    const body = JSON.stringify(login)

    for (const res of connections) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.statusCode = 200
      res.end(body)
    }

    hostnames = new Set()
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
      hostnames.add(hostname)
      connections.add(res)
    } else {
      const args = Array.from(arguments)
      args.push(doLogin)
      return Promise.resolve(fn.apply(this, args))
    }
  }
}
