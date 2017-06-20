(function (countlyDataPoints, $) {
    //Private Properties
    var _dataPointsObj = {};

    //Public Methods
    countlyDataPoints.initialize = function () {
        return $.when(
            $.ajax({
                type:"GET",
                url:countlyCommon.API_PARTS.data.r + "/times-of-day/times-of-day-points",
                data:{
                    "api_key":countlyGlobal.member.api_key
                },
                dataType:"jsonp",
                success:function (json) {
                    _dataPointsObj = json;                    
                }
            })
        ).then(function(){
            return true;
        });
    };

    countlyDataPoints.refresh = function () {
        return true;
    };

    countlyDataPoints.getDataPointsObj = function () {
        return _dataPointsObj;
    }


    function getAppName(appId) {
        if (appId == "all-apps") {
            return jQuery.i18n.map["compare.apps.all-apps"] || "All apps";
        } else if (countlyGlobal.apps[appId]) {
            return countlyGlobal.apps[appId].name;
        } else {
            return "Deleted app";
        }
    }

})(window.countlyDataPoints = window.countlyDataPoints || {}, jQuery);

