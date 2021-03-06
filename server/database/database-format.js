/**
 * @author tom@0x101.com
 *
 * Helper functionality related with formatting and processing database
 * fields.
 */
this.escape = function(string) {
	return string.replace(/'/g, "\\'");
};

this.timestamp = function() {
	return Math.round((new Date()).getTime() / 1000);
};

/**
 * Generic string representation for a timestamp.
 */
this.toDate = function(timestamp) {
	var date = new Date(timestamp*1000),
		hours = String(date.getHours()),
		minutes = String(date.getMinutes()),
		seconds = String(date.getSeconds()),
		day = String(date.getDay() + 1),
		month = String(date.getMonth() + 1),
		year = String(date.getFullYear());
	return day + '/' + month + '/' + year + ' ' + (hours.length > 1 ? hours : '0' + hours) + ':' + (minutes.length > 1 ? minutes : '0' + minutes) + ':' + (seconds.length > 1 ? seconds : '0' + seconds);
};

/**
 * Format a timestamp into RFC822
 */
this.toDateRFC822 = function(timestamp) {

	if (typeof timestamp === 'undefined') {
		var timestamp = new Date().getTime();
	} else {
		timestamp *=1000;
	}

	var date = new Date(timestamp),
		day = String(date.getDay()),
		hours = String(date.getHours()),
		minutes = String(date.getMinutes()),
		seconds = String(date.getSeconds()),
		day = String(date.getDay()),
		month = String(date.getMonth()),
		year = String(date.getFullYear());

	var weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
		months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

	return weekdays[day] + ', ' + (day > 9 ? day : '0' + day) + ' ' + months[month] + ' ' + year + ' ' + (hours > 9 ? hours : '0' + hours) + ':' + (minutes > 9 ? minutes : '0' + minutes) + ':' + (seconds > 9 ? seconds : '0' + seconds) + ' +0000';
	
};
