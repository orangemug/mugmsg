// ================
// Console
// ================
// TODO:
//   + Add stub loggin for production.


// We need to turn this into a class.
var Console = {};

// TODO: When its a class.
//function Console() {
//	// Override any current logging.
//	_console = window.console;
//	window.console = this;
//}

// Logging
Console.log = function(msg) {
	console.log(msg)
}


// Get arg names.
Console._functionArgNames = function(fn) {
    var args=/function.*\((.*)\)/.exec(fn);
    if(!args)return [];
    return args[1].split(/,\s*/);
}

// Log arguments in a function.
Console.logArgs = function(log_msg) {
	var cf = Console.logArgs.caller;
	var arg_names = Console._functionArgNames(cf)
	var log_lines = [];

	log_lines.push(log_msg+":");
	for(var i=0; i<cf.arguments.length; i++) {
		if( arg_names[i] ) {
			log_lines.push("  + "+arg_names[i]+" = "+cf.arguments[i].toString());
		} else {
			log_lines.push("  + undefined = "+cf.arguments[i]);
		}
	}

	Console.log( log_lines.join("\n") );
}