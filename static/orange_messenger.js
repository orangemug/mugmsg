function OrangeMessenger(opts) {
	this.user = {};

	// Register the divs.
	opts = opts || {};
	var registerDiv = opts['registerDiv'] || null;
	var messagesDiv = opts['messagesDiv'] || null;

	if(!registerDiv) throw "Missing registerDiv"
	if(!messagesDiv) throw "Missing messagesDiv"

	this.registerDiv = registerDiv;
	this.messagesDiv = messagesDiv;

	this.registeredUsername = null;
	this.registeredToken    = null;
}

OrangeMessenger.prototype.getUserColor = function(who) {
	// Does the user alread have a color.
	if(this.user[who] && this.user[who].color) {
		return this.user[who].color
	}

	this.user[who] = this.user[who] || {};
	return ( this.user[who].color = Util.randomColor() );
}



// Need to validate the level.
OrangeMessenger.prototype.addLog = function(level, msg) {
	Console.logArgs("Adding log");

	// Template data.
	m_obj = {
		message: {
			timestamp: Util.timestamp(),
			text:      msg,
			level:     level
		}
	}

	// Render
	this.messagesDiv.append(
		new EJS({url: 'log.ejs'}).render(m_obj)
	);

	// TODO: Make this jquery!
	// Scoll to the bottom
	document.getElementById("messages").scrollTop = document.getElementById("messages").scrollHeight;
}

OrangeMessenger.prototype.addMsg = function(who, msg, timedate, avatar_url) {
	Console.logArgs("Adding message");

	// Template data.
	m_obj = {
		user: {
			name:       who,
			color:      this.getUserColor(who),
			avatar_url: avatar_url
		},
		message: {
			timestamp: Util.timestamp(timedate),
			text:      msg
		}
	}

	// Render
	this.messagesDiv.append(
		new EJS({url: 'message.ejs'}).render(m_obj)
	);

	// TODO: Make this jquery!
	// Scoll to the bottom
	document.getElementById("messages").scrollTop = document.getElementById("messages").scrollHeight;
}

OrangeMessenger.prototype.getMessages = function() {
	Console.log("getMessages")

	obj = this;
	$.getJSON('json/getMessages?username='+this.registeredUsername+'&token='+this.registeredToken, function(data) {
		Console.log(data)

		for(i in data.messages) {
			m = data.messages[i]
			if (!obj.user[m.who]) obj.user[m.who] = {};
			obj.addMsg(m.who, m.message, new Date(), m.avatar)
		}

		obj.getMessages();
	})

}

OrangeMessenger.prototype.sendToServer = function(who, msg) {
	Console.logArgs("Send to server")

	// ajax with callback.
	obj = this;
	$.getJSON('json/send?username='+this.registeredUsername+'&token='+this.registeredToken+'&message='+msg, function(data) {
		Console.log(data)
		//addMsg(data['who'], data['message'], new Date(data['timestamp']))
		if (data['status'] != 'ok') {
			addLog('error', 'failed to send message');
			return
		}

		// Totally the wrong way to do this but it'll do for now.
		obj.getMessages();
	})
}

OrangeMessenger.prototype.send_msg = function(reg_input) {
	Console.log("Send msg")
	msg = reg_input.val();
	reg_input.val("");

	// Stop the user sending empty string
	if(msg == "") return false

	if(!this.isRegistered()) {
		Console.log("User not yet registered.")
		return false;
	}
	
	// Send the message to the server
	this.sendToServer(this.registeredUsername, msg)

	return false;
}

OrangeMessenger.prototype.isRegistered = function() {
	return (this.registeredToken ? true : false)
}

OrangeMessenger.prototype.register = function(username) {
	Console.logArgs("Registration user")

	var obj = this;
	$.getJSON('json/register?username='+username, function(data) {
		token = data['token'];
		if (!obj.user[username]) obj.user[username] = {};

		obj.registeredUsername = username;
		obj.registeredToken    = token;

		obj.getMessages();
		obj.regComplete(username)
	});
}



OrangeMessenger.prototype.regComplete = function(username) {
	Console.logArgs("Registration complete")

	// Switch to messages.
	$(".register").addClass("hide")
	$(".messages").removeClass("hide")
}

