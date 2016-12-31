# RetroPie-profiles-server
### `RetroPie-profiles` plugin Login Server base implementation

The [RetroPie-profiles][] plugin requires a "Login Server" to determine which users
database the profiles will log in as. This is a Node.js base implementation of
a "Login Server" which you can extend to implement your own login backend.


## Setup

Create a new project, and add `retropie-profiles-server` and `n8-server` as
dependencies:

```bash
$ npm init
# fill out the prompts

$ npm install --save n8-server retropie-profiles-server
# necessary dependencies are now installed
```

The `"start"` script in your `package.json` file should look something like

``` json
  "scripts": {
    "start": "n8-server --harmony-async-await retropie-profiles-server server.js"
  },
```

Finally, create a file called `server.js` with initial contents like:

```js
module.exports = async function (req, res) {
  const name = 'Nate'
  const id = 1

  // you may emit the "login" event on `res` to log in a user
  res.emit('login', {
    // Make sure you use a unique ID associated with the user.
    // This would usually be a user ID or database ID
    id: id,

    // This is the user name that is displayed in the Login status page.
    // Only used for display purposes
    name: name
  })

  // you have complete control over the HTTP request and response
  res.setHeader('Content-Type', 'text/plain')
  res.end('Hello from the Login Server!')
}
```

You can run the server on localhost port 3000 by running:

```bash
$ npm start -- --port 3000
```

That's it!

 - For a more concrete (but still silly) example, take a look at [`example.js`](./example.js).
 - For a more real-world useful exmaple, take a look at [`RetroPie-profiles-facebook-login`][fb].


## Deploying to [Now](https://now.sh)

First, [download `now`](https://zeit.co/download). Then, run `now` inside your
project's directory:

```bash
$ now
```

Use the resulting URL as your "Login Server" URL for RetroPie-profiles.

It's also highly recommended to use the `now alias` command to give the
deployment a more memorable URL to type in on your mobile device.


## License

(The MIT License)

Copyright (c) 2016 Nathan Rajlich &lt;n@n8.io&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[RetroPie-profiles]: https://github.com/TooTallNate/RetroPie-profiles
[fb]: https://github.com/TooTallNate/RetroPie-profiles-facebook-login
