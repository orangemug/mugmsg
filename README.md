# MugMsg
A simple example of messenger written in node.js. This is just a prototype and not no way near a complete chat client (although hopefully one day it will be...).

## What it does so far

 * Registers users with plain text name
 * Sends messages via the long polling technique
 * Adds in user avatar via gravatar (for future openid support)

![mugmsg_image](http://github.com/orangemug/mugmsg/raw/master/screenshots/example.png)


## The future...

 * Split up so you could in theroy have multiple chat instances on one page
 * Make it as unobtrusive as possible
 * Add openid support
   - Store user details in couchdb
 * Build a decent log library as a part of this app.


