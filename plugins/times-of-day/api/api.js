var plugin = {},
plugins = require('../../pluginManager.js'),
common = require('../../../api/utils/common.js'),
log = common.log('times-of-day:api');

(function (plugin) {

    plugins.register("/master", function(ob){
        // Allow configs to load & scanner to find all jobs classes
        setTimeout(() => {
            require('../../../api/parts/jobs').job('times-of-day:stats').replace().schedule('every 1 day');
        }, 10000);
    });

    /*
        Register to all requests to /plugins/drill to catch all events
        sent by plugins such as views and crashes
        */
        plugins.register("/plugins/drill", function(ob){
            var eventCount = 0;

            if (ob.events && Array.isArray(ob.events)) {
                var events = ob.events;

                for (var i = 0; i < events.length; i++) {
                    if (events[i].key) {
                        eventCount += (events[i].count)? events[i].count : 1;
                    }
                }

                updateDataPoints(ob.params.app_id, eventCount);
            }
        });

    /*
        Register to /sdk/end for requests that contain begin_session and events
        */
        plugins.register("/sdk/end", function(ob) {
            var params = ob.params,
            sessionCount = 0,
            eventCount = 0;

            if (!params.cancelRequest) {
                if (params.qstring.events && Array.isArray(params.qstring.events)) {
                    var events = params.qstring.events;

                    for (var i = 0; i < events.length; i++) {
                        if (events[i].key) {
                            eventCount += (events[i].count)? events[i].count : 1;
                        }
                    }
                }

            // If the last end_session is received less than 15 seconds ago we will ignore
            // current begin_session request and mark this user as having an ongoing session
            var lastEndSession = params.app_user && params.app_user[common.dbUserMap['last_end_session_timestamp']] || 0;

            if (params.qstring.begin_session && (params.qstring.ignore_cooldown || !lastEndSession || (params.time.timestamp - lastEndSession) > plugins.getConfig("api").session_cooldown)) {
                sessionCount++;
            }

            updateDataPoints(params.app_id, sessionCount+eventCount);
        }

        return true;
    });

    /*
        Saves session and event count information to times_of_day_data_points
        collection in countly database

        Sample document is like below where a is the app id, m is the month,
        e is event count and s is the session count

        {
            "_id" : "58496f1c81ccb91a37dbb1d0_2016:12",
            "a" : "58496f1c81ccb91a37dbb1d0",
            "m" : "2016:12",
            "e" : 1898,
            "s" : 286
        }
        */
        function updateDataPoints(appId, eventCount) {
            var utcMoment = common.moment.utc();

            common.db.collection('times_of_day_data_points').update(
            {
                // '_id': appId + "_" + utcMoment.format("YYYY:M")
                '_id': appId + "_"+ utcMoment.format("dddd:HH")
            },
            {
                $set: {
                    a: appId + "",
                    m: utcMoment.format("dddd:HH")
                },
                $inc: {
                    e: eventCount
                }
            },
            {
                upsert: true
            },
            function() {}
            );
        }

    /*
        Returns session, event and data point count
           */


     plugins.register('/o/times-of-day/times-of-day-points', function(ob) {
        var params = ob.params;

        ob.validateUserForMgmtReadAPI(function() {
            if (!params.member.global_admin) {
                return common.returnMessage(params, 401, 'User is not a global administrator');
            }

            var filter = {};


            common.db.collection("times_of_day_data_points").find(filter, {}).toArray(function(err, dataPerApp){
                common.returnOutput(params, dataPerApp);
            });
        }, params);

        return true;
    });

}(plugin));

module.exports = plugin;