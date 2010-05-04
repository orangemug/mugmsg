// Util functions.
var Util = {};
Util.randomColor = function() {
	// Could start at 0Xffffff but then the color would be to light.
	return Math.round(0xcccccc * Math.random()).toString(16);
}

Util.timestamp = function(date) {
	date = date || new Date();
	var hours   = date.getHours();
	var minutes = date.getMinutes();
	var seconds = date.getSeconds();

	if (minutes < 10) minutes = "0"+minutes;
	if (seconds < 10) seconds = "0"+seconds;
	return ""+hours+":"+minutes+":"+seconds
}