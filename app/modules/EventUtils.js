module.exports = {

    getEventsAfterDate: function (events, strDate, callback) {
        var resEvents = [];
        var date = (new Date(strDate)).setHours(0, 0, 0, 0);
        // events = JSON.parse(events);
        for (var i = 0; i < events.length; i++) {
            // console.log(events[i]);
            var eventEndDate = (new Date(events[i].end)).setHours(0, 0, 0, 0);
            //console.log(date + '/' + eventDate);
            if (eventEndDate >= date) {
                //console.log('yes');
                resEvents.push(events[i]);
            }
        }
        callback(resEvents);
    },

    getEventsBetweenDates: function (events, strStartDate, strEndDate, callback) {
        var resEvents = [];
        var startDate = (new Date(strStartDate)).setHours(0, 0, 0, 0);
        var endDate = (new Date(strEndDate)).setHours(23, 59, 59, 999);

        // events = JSON.parse(events);
        for (var i = 0; i < events.length; i++) {
            //console.log(events[i]);
            var eventStartDate = (new Date(events[i].start)).setHours(0, 0, 0, 0);
            var eventEndDate = (new Date(events[i].end)).setHours(0, 0, 0, 0);

            //console.log(date + '/' + eventDate);
            if (eventEndDate >= startDate && eventStartDate <= endDate) {
                //console.log('yes');
                resEvents.push(events[i]);
            }
        }
        callback(resEvents);
    },

    getEventsBetweenDateTimes: function (events, strStartDateTime, strEndDateTime, callback) {
        var resEvents = [];
        var startDateTime = new Date(strStartDateTime).getTime();
        var endDateTime = new Date(strEndDateTime).getTime();
        // events = JSON.parse(events);
        for (var i = 0; i < events.length; i++) {
            //console.log(events[i]);
            var eventStartDate = (new Date(events[i].start)).getTime();
            var eventEndDate = (new Date(events[i].end)).getTime();
            //console.log(startDateTime + '/' + eventStartDate);
            //console.log(endDateTime + '/' + eventEndDate);
            if (eventEndDate > startDateTime && eventStartDate < endDateTime) {
                //console.log('yes');
                resEvents.push(events[i]);
            }
        }
        callback(resEvents);
    },

    getEventsForDate: function (events, strDate, callback) {
        var resEvents = [];
        var date = (new Date(strDate)).setHours(0, 0, 0, 0);
        // events = JSON.parse(events);
        for (var i = 0; i < events.length; i++) {
            // console.log(events[i]);
            var eventStartDate = (new Date(events[i].start)).setHours(0, 0, 0, 0);
            //console.log(date + '/' + eventDate);
            if (eventStartDate == date) {
                //console.log('yes');
                resEvents.push(events[i]);
            }
        }
        callback(resEvents);
    },

    sortEventsByStartDate: function (events, asc, callback) {
        events.sort(function (a, b) {
            // Turn your strings into dates, and then subtract them
            // to get a value that is either negative, positive, or zero.
            if (asc) {
                return new Date(a.start) - new Date(b.start);
            } else {
                return new Date(b.start) - new Date(a.start);
            }
        });
        callback(events);
    },

    getEventAtDateTime: function (events, strDate, callback) {
        var resEvent = '{}';
        var date = (new Date(strDate)).getTime();

        // events = JSON.parse(events);
        for (var i = 0; i < events.length; i++) {
            // console.log(events[i]);
            eventStartDate = (new Date(events[i].start)).getTime();
            eventEndDate = (new Date(events[i].end)).getTime();
            //console.log(events[i].title + '/' + date + '/' + eventStartDate + '/' + eventEndDate);
            if (eventStartDate <= date && eventEndDate > date) {
                //console.log('yes');
                resEvent = JSON.stringify(events[i]);
                break;
            }
        }
        console.log('resEvent');
        console.log(resEvent);
        callback(resEvent);
    },

    getTimeToNextEvent: function (sortedDateEvents, strStartDateTime, strDayStartDateTime, strDayEndDateTime, callback) {
        var nextEventStartDate = null;
        var response = null;
        var startDateTime = (new Date(strStartDateTime)).getTime();
        var dayStartDateTime = (new Date(strDayStartDateTime)).getTime();
        var dayEndDateTime = (new Date(strDayEndDateTime)).getTime();
        //console.log(strDayEndDateTime);
        //console.log(dayEndDateTime);

        if (startDateTime < dayStartDateTime || startDateTime > dayEndDateTime) {
            callback('{"success": false, "msg": "the desired hour is not in the printing hours interval"}');
            return;
        }

        this.getEventAtDateTime(sortedDateEvents, strStartDateTime, function (currentEvent) {
            if (currentEvent != '{}') {
                currentEvent = JSON.parse(currentEvent);
                console.log('currentEvent');
                console.log(currentEvent);
                startDateTime = (new Date(currentEvent.end)).getTime();
                //console.log(startDateTime);
                //console.log(dayStartDateTime);
                //console.log(strDayEndDateTime);
                //I don't know why, but I have to remake it here
                dayEndDateTime = (new Date(strDayEndDateTime)).getTime();
                //console.log(dayEndDateTime);

                if (startDateTime < dayStartDateTime || startDateTime > dayEndDateTime) {
                    callback('{"success": false, "msg": "the available hour is not in the printing hours interval"}');
                    return;
                }
            } else {
                //get the end date of the current event and the start date of the next event
                console.log('no currentEvent');

            }

            //find the next event start date
            for (var i = 0; i < sortedDateEvents.length; i++) {
                console.log(sortedDateEvents[i]);
                var eventStartDate = (new Date(sortedDateEvents[i].start)).getTime();
                //var eventEndDate = (new Date(sortedDateEvents[i].end)).getTime();
                if (eventStartDate >= startDateTime) {
                    //console.log(sortedDateEvents[i].title + '/' + date + '/' + eventStartDate + '/' + eventEndDate);

                    nextEventStartDate = eventStartDate;
                    break;
                }
            }

            if (nextEventStartDate != null) {
                response = (nextEventStartDate - startDateTime) / (3600000);
                response = response.toString();
            } else {
                var dayEndDateTime = (new Date(strDayEndDateTime)).getTime();
                response = (dayEndDateTime - startDateTime) / (3600000);
                response = response.toString();
            }
            //console.log(response);
            callback(response);
        });
    },
    isFreeSlot: function (events, strStartDateTime, strEndDateTime, callback) {
        var isFreeSlot = true;
        this.getEventsBetweenDateTimes(events, strStartDateTime, strEndDateTime, function (events) {
            //console.log(events);
            if (events.length != 0) {
                isFreeSlot = false;
            }
            callback(isFreeSlot);
        });

    },
    getNextFreeSlot: function (sortedDateFutureEvents, slotDuration, strStartDateTime, strDayStartDateTime, strDayEndDateTime, callback) {
        //console.log('in getNextFreeSlot');
        var nextEventStartDate = null;
        var response = null;

        var startDateTime = (new Date(strStartDateTime));
        var endDateTime = null;

        var dayStartDateTime = (new Date(strDayStartDateTime));
        var dayEndDateTime = (new Date(strDayEndDateTime));

        if (startDateTime.getHours() < dayStartDateTime.getHours() || startDateTime.getHours() > dayEndDateTime.getHours()) {
            callback({"success": false, "msg": "the desired hour has to be in the printing hours interval"});
            return;
        }
        //console.log(sortedDateFutureEvents);
        // events = JSON.parse(events);
        for (var i = 0; i < sortedDateFutureEvents.length; i++) {
            //console.log(sortedDateFutureEvents[i]);
            eventStartDate = (new Date(sortedDateFutureEvents[i].start));
            eventEndDate = (new Date(sortedDateFutureEvents[i].end));
            //console.log(events[i].title + '/' + date + '/' + eventStartDate + '/' + eventEndDate);

            //first see if we are in an event and move to the end of it if so
            if (eventStartDate.getTime() <= startDateTime.getTime() && eventEndDate.getTime() > startDateTime.getTime()) {
                startDateTime = eventEndDate;
                //we cannot allocate slots after dayEndDateTime
                //and we should move to tomorrow
                if (eventEndDate.getHours() > dayEndDateTime.getHours()) {
                    //move to tomorrow
                    startDateTime.setDate(startDateTime.getDate() + 1);
                    startDateTime.setHours(dayStartDateTime.getHours());
                }
            }

            //is this event is starting after our current start time
            if (eventStartDate.getTime() > startDateTime.getTime()) {
                // looks good but make sure that it is in the same day
                if ((eventStartDate.getTime() - startDateTime.getTime()) > 0) {
                    //put the event here
                    endDateTime = new Date(startDateTime.getTime() + 3600000 * slotDuration);
                    break;
                } else {
                    //check if we have enough time till it starts
                    if ((eventStartDate.getTime() - startDateTime.getTime()) / 3600000 >= slotDuration) {
                        //console.log(eventStartDate);
                        //console.log(startDateTime);

                        console.log('yes. it is bigger');
                        console.log((eventStartDate - startDateTime) / 3600000);
                        endDateTime = new Date(startDateTime.getTime() + 3600000 * slotDuration);
                        break;
                    } else {
                        startDateTime = eventEndDate;
                        //we cannot allocate slots after dayEndDateTime
                        //and we should move to tomorrow
                        if (eventEndDate.getHours() > dayEndDateTime.getHours()) {
                            //move to tomorrow
                            startDateTime.setDate(startDateTime.getDate() + 1);
                            startDateTime.setHours(dayStartDateTime.getHours());
                        }
                    }
                }
            }
            console.log(startDateTime);
            console.log(endDateTime);
        }
        if (endDateTime == null) {
            endDateTime = new Date(startDateTime.getTime() + 3600000 * slotDuration);
        }
        response = {"startDateTime": startDateTime, "endDateTime": endDateTime};
        //console.log('response');
        //console.log(response);
        callback(response);
    },
    generateRecurringEvents: function (events, reccuringEvents, strStartDate, strEndDate, callback) {
        var startDate = (new Date(strStartDate));
        startDate.setHours(0, 0, 0, 0);
        //console.log(startDate);
        var endDate = (new Date(strEndDate));
        endDate.setHours(23, 59, 59, 999);
        //console.log(endDate);
        var currentDate = new Date(startDate);
        currentDate.setHours(0, 0, 0, 0);
        while (currentDate.getTime() <= endDate.getTime()) {
            //console.log(currentDate);
            for (var i = 0; i < reccuringEvents.length; i++) {
                //console.log(reccuringEvents[i]);
                var dayMatched = false;
                //get reccurence type of event
                //see if it matches for the current day
                //echo $events[$i]['id_reccurenceType'];
                //echo $events[$i]['name'];
                if (reccuringEvents[i].idReccurenceType == 1) {//daily
                    //console.log('daily');
                    dayMatched = true;
                } else if (reccuringEvents[i].idReccurenceType == 2) { //weekly
                    //console.log('weekly');
                    var dayOfWeek = currentDate.getDay();
                    if (reccuringEvents[i].dayOfWeek == dayOfWeek) {
                        dayMatched = true;
                    }
                } else if (reccuringEvents[i].idReccurenceType == 3) {//monthly
                    //console.log('monthly');
                    var dayOfMonth = currentDate.getDate();
                    ;
                    if (reccuringEvents[i].dayOfMonth == dayOfMonth) {
                        dayMatched = true;
                    }
                }

                if (dayMatched) {
                    //console.log('day matched');
                    var eventStartDate = new Date(currentDate);
                    var eventEndDate = new Date(currentDate);

                    eventStartDate.setTime(eventStartDate.getTime() + reccuringEvents[i].startHours * 3600000);
                    eventEndDate.setTime(eventEndDate.getTime() + reccuringEvents[i].endHours * 3600000);

                    //console.log (eventStartDate);
                    //console.log (eventEndDate);

                    events.push({"title": reccuringEvents[i].title, "start": eventStartDate, "end": eventEndDate})

                }
            }

            currentDate.setDate(currentDate.getDate() + 1);


        }
        callback(events);

    }

}