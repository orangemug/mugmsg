// Require library packages.
var sys         = require('sys'),
    http        = require('http'),
    querystring = require('querystring');

// Custom packages.
var md5      = require('./md5');


function initServer(port, reqMgr, opts) {
    var port       = port,
        portMax    = opts['portMax'] || port
        tryConnect = true,
        connected  = false;

    try {
        // Create a req init and req response.
        reqOpr = opts['reqHdlr'] || reqInit
        reqHdlr = function(req, resp) {
            reqOpr(req, resp);
            reqMgr.call(req,resp)
        }
    } catch(err) {
        throw 'REQ_HDLR_MISSING'
    }

    while(tryConnect && !connected) {
        try {
            sys.puts("Trying to conntect on port:"+port)
            http.createServer(reqHdlr).listen(port);
            connected = true;
        } catch(err) {
            sys.puts("Failed to connect on port:"+port)
            if(err.errno == 98) {
                if (port < portMax) {
                    port++;
                    tryConnect = true;
                } else {
                    tryConnect = false;
                }
            } else {
                tryConnect = false;
            }
        }
    }

    if(!connected) {
        throw "NO_FREE_PORTS"
    }

    sys.puts('Server running at http://localhost:'+port+'/');
}


function ReqRender() {
    // Initialize
    this.renderer = new SimpleRender();
}

ReqRender.prototype.renderer = function(renderer) {
    this.renderer = renderer;
}

ReqRender.prototype.render = function(content) {
   return this.renderer.exec(content)
}



function SimpleRender() {}
SimpleRender.prototype.exec = function(content) {
    return content
}

function getGravatarUrl(email, size) {
	return "http://www.gravatar.com/avatar/"+md5.hex_md5(email)+"?s="+size+"&d=monsterid"
}



var reqMgr = new ReqMgr();
initServer(8000, reqMgr, {
    portMax: 8002
})



function ReqMgr() {
    this.reqActs = [];
}

// this will support regular expressions
ReqMgr.prototype.hdlr = function(url, callback) {
    sys.puts("Adding req handler:"+url)
    this.reqActs[url] = callback;
}

ReqMgr.prototype.call = function(req,resp) {
	// Remove the leading '/' from the url.
	url = req.url.substr(1)
	sys.puts("Attempting to call: "+url)

	r = null;
	for(i in this.reqActs) {
		// TODO: Re-enable regex when fixed.
		if( false && i.substr(0,1) == "/" ) {
			sys.puts("i="+i)
			sys.puts(new RegExp(i.substr(1,i.length-2)))
			m = new RegExp(i.substr(1,i.length-2)).exec(url) 
		} else {
			u = require('url').parse(url).pathname

			// Check for match.
			m = ( u == i )
		}

		if(m) {
			r = this.reqActs[i]
			break
		}
	}

	if(!r) {
		sys.puts("Call to '"+url+"' is invalid.")
		resp.writeHead(200, {'Content-Type': 'text/html'});
		resp.write("Invalid handler.")
		resp.end();
		return
	}


	// Set request/response
	r.prototype['req']  = req;
	r.prototype['resp'] = resp;

	// Initialize views if not initialized. 
	r.prototype['view'] = new ReqRender();

	new r();
}

fs = require('fs')

reqMgr.hdlr('go', function() {
	resp = this.resp;
	fs.readFile('index.html', function(err, data) {
		resp.writeHead(200, {'Content-Type': 'text/html'});
		resp.end(data);
	});
})



reqMgr.hdlr('hello', function() {
    this.resp.writeHead(200, {'Content-Type': 'text/html'});
    for(var i=0; i<100; i++) {
        this.resp.write(this.view.render(''+i+'<br>'));
    }

	while(true) {}

    this.resp.end();
});



reqMgr.hdlr('test_req', function() {
	this.resp.writeHead(200, {'Content-Type': 'text/html'});
	a = querystring.parse(this.req.url);
	for(i in a) {
		this.resp.write("<b>"+i+":</b>"+a[i]+"<br>");
	}
	this.resp.end();
});


// TODO: Replace with a md5 string.
function genUsernameToken() {
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var string_length = 8;
	var randomstring = '';
	for (var i=0; i<string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
	return randomstring;
}



var users = {};
reqMgr.hdlr('json/register', function() {
	args = require('url').parse(this.req.url, true).query;

	this.resp.writeHead(200, {'Content-Type': 'application/json'});

	for(i in args) {
		sys.puts(i + "=" + args)
	}

	un = args['username']
	if(!un) throw 'NO_USERNAME_TO_REGISTER';

	if (!users[un]) users[un] = {};
	users[un].token = genUsernameToken();
	users[un].avatar = getGravatarUrl(un, 35)

	resp_json = {
		'token': users[un].token
	}

	sys.puts("Adding messages to connected users inboxes")
	for(var i in users) {
		// Don't tell the user about his own login.
		if(i == un) continue;

		if (!users[i]['inbox']) users[i].inbox = []

		users[i].inbox.push({
			who:     un,
			message: "JUST JOINED.",
			avatar:  users[un]['avatar']
		})

		if(!users[i]['resp']) users[i].resp = null
		if(users[i].resp) {
			users[i].resp.writeHead(200, {'Content-Type': 'application/json'});
			users[i].resp.end(JSON.stringify({
				messages: users[i].inbox
			}))
			users[i].inbox = null;
		}
	}

	this.resp.end(JSON.stringify(resp_json));
})

function json_error() {
}

reqMgr.hdlr('json/send', function() {
	args = require('url').parse(this.req.url, true).query;

	this.resp.writeHead(200, {'Content-Type': 'application/json'});

	un = args['username']
	if(!un) {
		this.resp.end(JSON.stringify({error: "No username given"}))
		return
	}

	token = args['token']
	if(!token) {
		this.resp.end(JSON.stringify({error: "No token given"}))
		return
	}

	if(!users[un]) {
		this.resp.end(JSON.stringify({error: "Invalid username"}))
		return
	}

	if( users[un].token != token ) {
		this.resp.end(JSON.stringify({error: "Token does not match"}))
		return
	}

	sys.puts("Adding messages to connected users inboxes")
	for(var i in users) {
		if (!users[i]['inbox']) users[i].inbox = []

		users[i].inbox.push({
			who:     un,
			message: args['message'],
			avatar:  users[un]['avatar']
		})

		if(!users[i]['resp']) users[i].resp = null

		if(users[i].resp) {
			users[i].resp.writeHead(200, {'Content-Type': 'application/json'});
			users[i].resp.end(JSON.stringify({
				messages: users[i].inbox
			}))
			users[i].inbox = null;
		}
	}


	this.resp.end(JSON.stringify({status: 'ok'}))
})


function validateUser(username, token) {
	if(!username) {
		return {status: 'invalid', message: "No username given"}
	}

	if(!token) {
		return {status: 'invalid', message: "No token given"}
	}

	if(!users[username]) {
		return {status: 'invalid', message: "Invalid username"}
	}

	if( users[username].token != token ) {
		return {status: 'invalid', message: "Token does not match"}
	}

	return {status: 'valid'}
}

/*
reqMgr.hdlr('test', function() {
	resp = this.resp;
	setTimeout(function () {
		resp.writeHead(200, {'Content-Type': 'text/plain'});
		resp.end("TEST MESSAGE!!!")
	}, 5000);
})
*/

reqMgr.hdlr('json/getMessages', function() {
	args = require('url').parse(this.req.url, true).query;


	username = args['username']
	r = validateUser(
		username,
		args['token']
	)

	if (r['status'] != 'valid') {
		this.resp.writeHead(200, {'Content-Type': 'application/json'});
		this.resp.end(JSON.stringify({error: r['message']}))
		return
	}

	resp = this.resp
	users[username].resp = resp
	setTimeout(function() {
		resp.writeHead(200, {'Content-Type': 'application/json'});
		resp.end(JSON.stringify({
			messages: []
		}));
	}, 30000);


});




reqMgr.hdlr('test_resp', function() {
	msg_resp = {
		who:     "Orange Mug",
		message: "I like Tea!",
		timestamp: new Date().getTime()
	}

	this.resp.writeHead(200, {'Content-Type': 'text/html'});
	this.resp.end(JSON.stringify(msg_resp));
});


reqMgr.hdlr('callback', function() {

});





function reqInit(req, resp) {
    // Log out the request.
    sys.puts(req.client.remoteAddress);
    sys.puts(req.client.remotePort);
    sys.puts(req.client.secure);
}
