const _ = require('lodash');
const moment = require('moment');

module.exports = function(config) {

    const toUTC = function(unixTimestamp) {
        //javascript uses milliseconds, not seconds since the epoch.
        const timestamp = parseInt(unixTimestamp) * 1000;
        const date = moment(timestamp).utc();
        return date.format('YYYYMMDDTHHmmss[Z]')
    };

    const addLine = function(title, line) {
        let buffer = '';

        if (line === undefined || line === null) {
            return buffer;
        }

        if (title.length + 1 + line.length <= 73) {
            buffer += title + ':' + line.substr(0, 73) + '\r\n';
        } else {
            buffer += title + ':';
            let maxLen = 73 - title.length + 1;

            while (line.length >= maxLen) {
                //The space the the end of this string is SUPER-IMPORTANT!
                buffer += line.substr(0, maxLen) + '\r\n' + ' ';
                line = line.substr(maxLen);
                //We need to adjust the maxLen the first time we go through this
                //loop to accomidate the length of the title.  After the forst iteration,
                //we need to set it back to it's original value (73)
                maxLen = 73;
            }
            buffer += line.substr(0, 73) + '\r\n';
        }
        return buffer;
    };

    const createICS = function(config) {
        let buffer = '';

        buffer += addLine('BEGIN', 'VCALENDAR');
        buffer += addLine('VERSION', '2.0');
        buffer += addLine('PRODID', '-//COSCHEDULE//COSICS//EN');
        buffer += addLine('CALSCALE', 'GREGORIAN');

        // Calendar Name
        if (config.title !== undefined) {
            buffer += addLine('X-WR-CALNAME', escapeText(config.title));
        }

        buffer += processJSONEvents(config.events);

        buffer += addLine('END', 'VCALENDAR');

        return buffer;
    };

    const processJSONEvents = function(events) {
        let buffer = '';
        _.each(events, function(evt) {

            let skip = false;
            if (evt.id === undefined) {
                console.log('Must Specify a unique id.')
                skip = true;
            }
            if (evt.start === undefined) {
                console.log('Must Specify a start date/time.')
                skip = true;
            }

            if (!skip) {

                buffer += addLine('BEGIN', 'VEVENT');
                buffer += addLine('UID', evt.id);

                buffer += addLine('SUMMARY', escapeText(evt.summary));
                buffer += addLine('DESCRIPTION', escapeText(evt.description));
                buffer += addLine('DTSTAMP', toUTC(moment().unix()));
                buffer += addLine('DTSTART', toUTC(evt.start));
                if (evt.end === undefined) {
                    //If there isn't an end time, assume it's an instantaneous
                    //event, and have it end one second after it starts.
                    buffer += addLine('DTEND', toUTC(evt.start + 1));
                } else {
                    buffer += addLine('DTEND', toUTC(evt.end));
                }
                buffer += addLine('CATEGORIES', evt.categories);
                buffer += addLine('URL', evt.url);
                buffer += addLine('END', 'VEVENT');
            } else {
                console.log('ERROR: ', evt);
            }
        });
        return buffer;
    };

    const escapeText = function(s) {
        let t;
        if (s == null) {
            return s;
        }
        t = s.replace(/([,;\\])/ig, '\\$1');
        t = t.replace(/\n/g, '\\n');
        return t;
    };

    return createICS(config);
};

//var json = {
//     events: [{
//      'id':'123456@todaymademyid',
//         'url': 'http://www.todamade.com',
//         'summary': 'Tweet: [HeadLine] {April 6, 2015} (Meal Planning Magic)',
//         'start': moment('2013-03-14 12:30:00', 'YYYY-MM-DD HH:mm:ss').unix(),
//         'categories': 'TWEET',
//         'description': 'Maybe we put the tweet in here? Man this is such a long post it's just so many characters I can't even believe how many characters there are here. \n Who even types so many characters?'
//     }, {
//      'id':'123457@todaymademyid',
//         'summary': 'Post: [Headline]',
//         'start': moment('2013-03-14 12:30:00', 'YYYY-MM-DD HH:mm:ss').unix(),
//         'categories': 'BLOG',
//         'description': 'Maybe we put the post in here?'
//     }]
//};
//
//console.log(module.exports(json));


