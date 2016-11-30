/**
 * Example `RetroPie-profiles` Login Server.
 *
 * Basically you just pick from a list of 3 users by name in this example.
 *
 * Surely your version will have some more interesting logic, like interfacing
 * to an authentication service or database on the internet.
 *
 * You have control over the req/res, but you have to emit a "login" event
 * on `res` in order for the login to happen on RetroPie. The event must be
 * passed an Object with `id` and `name` properties. `id` is the name of the
 * profile directory that will be associated with the user, and `name` is the
 * human readable name of the user.
 */
const { parse } = require('url')

module.exports = async function (req, res) {
  const parsed = parse(req.url, true)
  const { user } = parsed.query
  if (user) {
    // user submitted the form with a user selection
    res.emit('login', {
      // Make sure you use a unique ID associated with the user.
      // This would usually be a user ID or database ID
      id: user.toLowerCase(),

      // This is the user name that is displayed in the Login status page.
      // Only used for display purposes
      name: user
    })

    return `Logged in as ${user}. 🕹 on!`
  } else {
    res.setHeader('Content-Type', 'text/html')
    return `
      <html>
        <body>
          <p>
            Select a user:
            <ul>
              <li><a href="?user=Billy">Billy</a></li>
              <li><a href="?user=Bob">Bob</a></li>
              <li><a href="?user=Thornton">Thornton</a></li>
            </ul>
          </p>
        </body>
      </html>
    `
  }
}