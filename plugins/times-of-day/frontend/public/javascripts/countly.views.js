window.DataPointsView = countlyView.extend({
    beforeRender: function() {
        var self = this;

        return $.when($.get(countlyGlobal["path"]+'/times-of-day/templates/times-of-day-points.html', function(src){
            self.template = Handlebars.compile(src);
        }), countlyDataPoints.initialize()).then(function () {});
    },
    renderCommon:function (isRefresh) {
        var self = this;

        this.templateData = {
            "page-title": jQuery.i18n.map["times-of-day.times-of-day-points"],
            "periods": countlyDataPoints.getPeriods()
        };

        if (!isRefresh) {
            self.el.html(this.template(this.templateData));

            // self.dtable = $('.d-table').dataTable($.extend({}, $.fn.dataTable.defaults, {
            //     "aaData": countlyDataPoints.getTableData(),
            //     "aoColumns": [
            //     { "mData": "app-name", "sType":"string", "sTitle": jQuery.i18n.map["compare.apps.app-name"] || "App Name", "sClass": "break" },
            //     { "mData": "sessions", "sType":"formatted-num", "mRender":function(d) { return countlyCommon.formatNumber(d); }, "sTitle": jQuery.i18n.map["sidebar.analytics.sessions"] },
            //     { "mData": "events", "sType":"formatted-num", "mRender":function(d) { return countlyCommon.formatNumber(d); }, "sTitle": jQuery.i18n.map["sidebar.events"] },
            //     { "mData": "times-of-day-points", "sType":"formatted-num", "mRender":function(d) { return countlyCommon.formatNumber(d); }, "sTitle": jQuery.i18n.map["times-of-day.times-of-day-points"] }
            //     ]
            // }));

            // $(".d-table").stickyTableHeaders();

            load(countlyGlobal["path"]+'/times-of-day/templates/sample.csv');


            // $("#times-of-day-points-period").on("click", ".button", function() {
            //     var period = $(this).data("period");
            //     countlyDataPoints.setPeriod(period);

            //     CountlyHelpers.refreshTable(self.dtable, countlyDataPoints.getTableData());

            //     $("#times-of-day-points-period").find(".button").removeClass("active");
            //     $(this).addClass("active");
            // });
        }
    },
    refresh:function () {
        return true;
    }
});

app.dataPointsView = new DataPointsView();

app.route("/manage/times-of-day-points", '', function () {
    this.renderWhenReady(this.dataPointsView);
});

$(document).ready(function() {
    if(countlyGlobal["member"].global_admin){
        var menu = '<a href="#/manage/times-of-day-points" class="item">'+
        '<div class="text" data-localize="times-of-day.times-of-day-points"></div>'+
        '</a>';

        if($('#management-submenu .help-toggle').length) {
            $('#management-submenu .help-toggle').before(menu);
        } else {
            $('#management-submenu').append(menu);
        }
     
    }
});

function load(name) {
    console.log('load:in');
    d3.text(name, function(dataCSV) {
        console.log('load:in:text');

        var labelsX = null;
        var data = [];

        d3.csv.parseRows(dataCSV, function(d) {

          if (labelsX === null) return labelsX = d.slice(1);

          var values = d.slice(1);
          var i = 0;

          for (; i < values.length; i++) {
            values[i] = parseInt(values[i], 10);
        }

        data.push({
            label: d[0],
            values: values
        });

    });

        update(data, labelsX);
    });
}

function update(data, labelsX) {
    console.log('load:in:update');
    console.log(data);
    console.log(labelsX);
    var margintop = 10;
    var marginright = 10; 
    var marginbottom = 10; 
    var marginleft = 15;
    var width = 960 - marginleft - marginright;
    var height = 405 - margintop - marginbottom;
    var padding = 3;
    var xLabelHeight = 30;
    var yLabelWidth = 80;
    var borderWidth = 3;
    var duration = 500;

    var chart = d3.select('#times-of-day-points-chart').append('svg')
    .attr('width', width + marginleft + marginright)
    .attr('height', height + margintop + marginbottom)
    .append('g')
    .attr('transform', 'translate(' + marginleft + ',' + margintop + ')');

    var border = chart.append('rect')
    .attr('x', yLabelWidth)
    .attr('y', xLabelHeight)
    .style('fill-opacity', 0)
    .style('stroke', '#000')
    .style('stroke-width', borderWidth)
    .style('shape-rendering', 'crispEdges');

    var allValues = Array.prototype.concat.apply([], data.map(function(d) { return d.values; }));
    var maxWidth = d3.max(data.map(function(d) { return d.values.length; }));
    var maxR = d3.min([(width - yLabelWidth) / maxWidth, (height - xLabelHeight) / data.length]) / 2;

    var r = function(d) {
      if (d === 0) return 0;

      f = d3.scale.sqrt()
      .domain([d3.min(allValues), d3.max(allValues)])
      .rangeRound([2, maxR - padding]);

      return f(d);
  }

  var c = d3.scale.linear()
  .domain([d3.min(allValues), d3.max(allValues)])
  .rangeRound([255 * 0.8, 0]);

  var rows = chart.selectAll('.row')
  .data(data, function(d){ return d.label; });

  rows.enter().append('g')
  .attr('class', 'row');

  rows.exit()
  .transition()
  .duration(duration)
  .style('fill-opacity', 0)
  .remove();

  rows.transition()
  .duration(duration)
  .attr('transform', function(d, i){ return 'translate(' + yLabelWidth + ',' + (maxR * i * 2 + maxR + xLabelHeight) + ')'; });

  var dots = rows.selectAll('circle')
  .data(function(d){ return d.values; });

  dots.enter().append('circle')
  .attr('cy', 0)
  .attr('r', 0)
  .style('fill', '#ffffff')
  .text(function(d){ return d; });

  dots.exit()
  .transition()
  .duration(duration)
  .attr('r', 0)
  .remove();

  dots.transition()
  .duration(duration)
  .attr('r', function(d){ return r(d); })
  .attr('cx', function(d, i){ return i * maxR * 2 + maxR; })
  .style('fill', function(d){ return 'rgb(' + c(d) + ',' + c(d) + ',' + c(d) + ')'; });

  var dotLabels = rows.selectAll('.dot-label')
  .data(function(d){ return d.values; });

  var dotLabelEnter = dotLabels.enter().append('g')
  .attr('class', 'dot-label')
  .on('mouseover', function(d){
    var selection = d3.select(this);
    selection.select('rect').transition().duration(100).style('opacity', 1);
    selection.select("text").transition().duration(100).style('opacity', 1);
})
  .on('mouseout', function(d){
    var selection = d3.select(this);
    selection.select('rect').transition().style('opacity', 0);
    selection.select("text").transition().style('opacity', 0);
});

  dotLabelEnter.append('rect')
  .style('fill', '#000000')
  .style('opacity', 0);

  dotLabelEnter.append('text')
  .style('text-anchor', 'middle')
  .style('fill', '#ffffff')
  .style('opacity', 0);

  dotLabels.exit().remove();

  dotLabels
  .attr('transform', function(d, i){ return 'translate(' + (i * maxR * 2) + ',' + (-maxR) + ')'; })
  .select('text')
  .text(function(d){ return d; })
  .attr('y', maxR + 4)
  .attr('x', maxR);

  dotLabels
  .select('rect')
  .attr('width', maxR * 2)
  .attr('height', maxR * 2);

  var xLabels = chart.selectAll('.xLabel')
  .data(labelsX);

  xLabels.enter().append('text')
  .attr('y', xLabelHeight)
  .attr('transform', 'translate(0,-6)')
  .attr('class', 'xLabel')
  .style('text-anchor', 'middle')
  .style('fill-opacity', 0);

  xLabels.exit()
  .transition()
  .duration(duration)
  .style('fill-opacity', 0)
  .remove();

  xLabels.transition()
  .text(function (d) { return d; })
  .duration(duration)
  .attr('x', function(d, i){ return maxR * i * 2 + maxR + yLabelWidth; })
  .style('fill-opacity', 1);

  var yLabels = chart.selectAll('.yLabel')
  .data(data, function(d){ return d.label; });

  yLabels.enter().append('text')
  .text(function (d) { return d.label; })
  .attr('x', yLabelWidth)
  .attr('class', 'yLabel')
  .style('text-anchor', 'end')
  .style('fill-opacity', 0);

  yLabels.exit()
  .transition()
  .duration(duration)
  .style('fill-opacity', 0)
  .remove();

  yLabels.transition()
  .duration(duration)
  .attr('y', function(d, i){ return maxR * i * 2 + maxR + xLabelHeight; })
  .attr('transform', 'translate(-6,' + maxR / 2.5 + ')')
  .style('fill-opacity', 1);

  var vert = chart.selectAll('.vert')
  .data(labelsX);

  vert.enter().append('line')
  .attr('class', 'vert')
  .attr('y1', xLabelHeight + borderWidth / 2)
  .attr('stroke', '#888')
  .attr('stroke-width', 1)
  .style('shape-rendering', 'crispEdges')
  .style('stroke-opacity', 0);

  vert.exit()
  .transition()
  .duration(duration)
  .style('stroke-opacity', 0)
  .remove();

  vert.transition()
  .duration(duration)
  .attr('x1', function(d, i){ return maxR * i * 2 + yLabelWidth; })
  .attr('x2', function(d, i){ return maxR * i * 2 + yLabelWidth; })
  .attr('y2', maxR * 2 * data.length + xLabelHeight - borderWidth / 2)
  .style('stroke-opacity', function(d, i){ return i ? 1 : 0;});

  var horiz = chart.selectAll('.horiz').
  data(data, function(d){ return d.label; });

  horiz.enter().append('line')
  .attr('class', 'horiz')
  .attr('x1', yLabelWidth + borderWidth / 2)
  .attr('stroke', '#888')
  .attr('stroke-width', 1)
  .style('shape-rendering', 'crispEdges')
  .style('stroke-opacity', 0);

  horiz.exit()
  .transition()
  .duration(duration)
  .style('stroke-opacity', 0)
  .remove();

  horiz.transition()
  .duration(duration)
  .attr('x2', maxR * 2 * labelsX.length + yLabelWidth - borderWidth / 2)
  .attr('y1', function(d, i){ return i * maxR * 2 + xLabelHeight; })
  .attr('y2', function(d, i){ return i * maxR * 2 + xLabelHeight; })
  .style('stroke-opacity', function(d, i){ return i ? 1 : 0; });

  border.transition()
  .duration(duration)
  .attr('width', maxR * 2 * labelsX.length)
  .attr('height', maxR * 2 * data.length);

}