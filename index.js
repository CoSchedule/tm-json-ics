var _ = require('underscore')._;
var moment = require('moment');

module.exports = function(events) {
    this.file = "";
    
    var toUTC = function(unixTimestamp) {
        //javescript uses millisecs, not seconds since the epoch.
        timestamp = parseInt(unixTimestamp) * 1000;
        date = moment(timestamp).utc();
        return date.format('YYYYMMDDTHHmmss[Z]')
    };

    var addLine = function(title, line) {

        if (line === undefined || line === null) {
            return;
        }

        if (title.length + 1 + line.length <= 73) {
            this.file += title + ":" + line.substr(0, 73) + "\r\n";
        } else {
            this.file += title + ":";
            var maxlen = 73 - title.length + 1;

            while (line.length >= maxlen) {
                //The space the the end of this string is SUPER-IMPORTANT!
                this.file += line.substr(0, maxlen) + "\r\n" + " ";
                line = line.substr(maxlen);
                //We need to adjust the maxlen the first time we go through this 
                //loop to accomidate the length of the title.  After the forst iteration,
                //we need to set it back to it's original value (73)
                maxlen = 73;
            }
            this.file += line.substr(0, 73) + "\r\n";
        }
    };

    var createICS = function(events) {	
    	this.file = "";

    	addLine("BEGIN", "VCALENDAR");
		addLine("PRODID", "-//JSON2CSI-TM//NONSGML//EN");
		addLine("VERSION", "1.0");
		addLine("CALSCALE", "GREGORIAN");

		processJSONEvents(events);

		addLine("END", "VCALENDAR")
		return this.file;
    };

    var processJSONEvents = function(jsonEvents) {
        var self = this;
        _.each(jsonEvents.events, function(evt) {

        	var skip = false;
        	if(evt.id === undefined) {
        		console.log("Must Specify a unique id.")
        		skip=true;
        	}
        	if(evt.start === undefined) {
        		console.log("Must Specify a start date/time.")
        		skip=true;
        	}

        	if(!skip) {

	            addLine("BEGIN", "VEVENT");
	            addLine("UID", evt.id);

	            addLine("SUMMARY", evt.summary);
	            addLine("DESCRIPTION", evt.description);
	            addLine("DTSTAMP", toUTC(moment().unix()));
	            addLine("DTSTART", toUTC(evt.start));
	            if (evt.end == undefined) {
	                //If there isn't an end time, assume it's an instantaneous
	                //event, and have it end one second after it starts. 
	                addLine("DTEND", toUTC(evt.start + 1));
	            } else {
	                addLine("DTEND", toUTC(evt.end));
	            }
	            addLine("CATEGORIES", evt.categories);
	            addLine("URL", evt.url);
	            addLine("END", "VEVENT");
	        }
	        else
	        {
	        	console.log("ERROR: ",evt);
	        }
        });
    };
    
	return createICS(events);
};

// json = {
//     events: [{
//     	'id':'123456@todaymademyid',
//         "url": "http://www.todamade.com",
//         "summary": "Tweet: [HeadLine]",
//         "start": moment("2013-03-14 12:30:00", "YYYY-MM-DD HH:mm:ss").unix(),
//         'categories': 'TWEET',
//         "description": "Maybe we put the tweet in here? Man this is such a long post it's just so many characters I can't even believe how many charaters there are here. \n Who even types so many characters?"
//     }, {
//     	'id':'123457@todaymademyid',
//         "summary": "Post: [Headline]",
//         "start": moment("2013-03-14 12:30:00", "YYYY-MM-DD HH:mm:ss").unix(),
//         'categories': 'BLOG',
//         "description": "Maybe we put the post in here?"
//     }]
// }