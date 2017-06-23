(function (countlyTimesDayData, $) {
    //Private Properties
    var _timesDayDataObj = {};

    //Public Methods
    countlyTimesDayData.initialize = function () {
        return $.when(
            $.ajax({
                type:"GET",
                url:countlyCommon.API_PARTS.data.r + "/times-of-day/times-of-day-points",
                data:{
                    "api_key":countlyGlobal.member.api_key
                },
                dataType:"jsonp",
                success:function (json) {
                    _timesDayDataObj = json;                    
                }
            })
        ).then(function(){
            return true;
        });
    };

    countlyTimesDayData.refresh = function () {
        return true;
    };

    countlyTimesDayData.getTimesDayDataObj = function () {
        return _timesDayDataObj;
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

})(window.countlyTimesDayData = window.countlyTimesDayData || {}, jQuery);

