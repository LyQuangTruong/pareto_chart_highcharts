var d3 = require("d3");
var Highcharts = require("highcharts");
require("highcharts/modules/pareto")(Highcharts);
var moment = require("moment");
var colData = [];
var categoryX = [];
var seriesData = [];

ParetoChartHighChart.defaultSettings = {
  HorizontalAxis: "value",
  Legend: "reason",
  Timestamp: "ts",
  Title: "Pareto Chart high charts",
};

ParetoChartHighChart.settings = EnebularIntelligence.SchemaProcessor(
  [
    {
      type: "text",
      name: "Title",
    },
  ],
  ParetoChartHighChart.defaultSettings
);

function createParetoChartHighChart(that) {
  if (seriesData != []) seriesData = [];
  if (categoryX != []) categoryX = [];
  ConvertDataAPI(that);
  that.paretoChartHighChartC3 = Highcharts.chart("root", {
    chart: {
      renderTo: "root",
      type: "column",
    },
    title: {
      text: that.settings.Title,
    },
    tooltip: {
      shared: true,
    },
    xAxis: {
      categories: categoryX,
      crosshair: true,
    },
    yAxis: [
      {
        title: {
          text: "value",
        },
      },
      {
        title: {
          text: "",
        },
        minPadding: 0,
        maxPadding: 0,
        max: 100,
        min: 0,
        opposite: true,
        labels: {
          format: "{value}%",
        },
      },
    ],
    series: [
      {
        type: "pareto",
        name: "Pareto",
        yAxis: 1,
        zIndex: 10,
        baseSeries: 1,
        tooltip: {
          valueDecimals: 2,
          valueSuffix: "%",
        },
      },
      {
        name: that.settings.Legend,
        type: "column",
        zIndex: 2,
        data: seriesData,
      },
    ],
  });
}

function ParetoChartHighChart(settings, options) {
  var that = this;
  this.el = window.document.createElement("div");
  this.el.id = "chart";

  this.settings = settings;
  this.options = options;
  this.data = [];
  this.maxNumber = 0;
  this.minNumber = 0;

  this.width = options.width || 700;
  this.height = options.height || 500;

  this.margin = { top: 20, right: 80, bottom: 30, left: 50 };

  setTimeout(function () {
    createParetoChartHighChart(that);
  }, 100);
}

ParetoChartHighChart.prototype.addData = function (data) {
  var that = this;
  function fireError(err) {
    if (that.errorCallback) {
      that.errorCallback({
        error: err,
      });
    }
  }

  if (data instanceof Array) {
    var value = this.settings.HorizontalAxis;
    var legend = this.settings.Legend;
    var ts = this.settings.Timestamp;

    this.filteredData = data
      .filter((d) => {
        let hasLabel = d.hasOwnProperty("reason");
        const dLabel = d["reason"];
        if (typeof dLabel !== "string") {
          fireError("VerticalAxis is not a string");
          hasLabel = false;
        }
        return hasLabel;
      })
      .filter((d) => {
        let hasLabel = d.hasOwnProperty(value);
        const dLabel = d[value];
        if (typeof dLabel !== "string" && typeof dLabel !== "number") {
          fireError("VerticalAxis is not a string or number");
          hasLabel = false;
        }
        return hasLabel;
      })
      .filter((d) => {
        let hasTs = d.hasOwnProperty(ts);
        if (isNaN(d[ts])) {
          fireError("timestamp is not a number");
          hasTs = false;
        }
        return hasTs;
      })
      .sort((a, b) => b.value - a.value);
    if (this.filteredData.length === 0) {
      return;
    }
    this.data = d3
      .nest()
      .key(function (d) {
        return d[legend];
      })
      .entries(this.filteredData)
      .sort(function (a, b) {
        if (a.key < b.key) return -1;
        if (a.key > b.key) return 1;
        return 0;
      });
    this.convertData();
  } else {
    fireError("no data");
  }
};

ParetoChartHighChart.prototype.clearData = function () {
  this.data = {};
  colData = [];
  seriesData = [];
  categoryX = [];
  this.refresh();
};

ParetoChartHighChart.prototype.convertData = function () {
  colData = this.data;
  this.refresh();
};

function ConvertDataAPI(that) {
  categoryX = [];
  seriesData = [];
  colData.forEach(function (val, index) {
    for (var i = 0; i < val.values.length; i++) {
      seriesData.push(colData[index]["values"][i]["value"]);
      categoryX.push(colData[index]["values"][i]["reason"]);
    }
  });
}

ParetoChartHighChart.prototype.resize = function (options) {
  this.width = options.width;
  this.height = options.height - 50;
};

ParetoChartHighChart.prototype.refresh = function () {
  var that = this;

  ConvertDataAPI(that);

  if (this.axisX) this.axisX.remove();
  if (this.axisY) this.axisY.remove();
  if (this.yText) this.yText.remove();

  if (that.paretoChartHighChartC3) {
    that.barChartHighChartC3 = Highcharts.chart("root", {
      chart: {
        renderTo: "root",
        type: "column",
      },
      title: {
        text: that.settings.Title,
      },
      tooltip: {
        shared: true,
      },
      xAxis: {
        categories: categoryX,
        crosshair: true,
      },
      yAxis: [
        {
          title: {
            text: "value",
          },
        },
        {
          title: {
            text: "",
          },
          minPadding: 0,
          maxPadding: 0,
          max: 100,
          min: 0,
          opposite: true,
          labels: {
            format: "{value}%",
          },
        },
      ],
      series: [
        {
          type: "pareto",
          name: "Pareto",
          yAxis: 1,
          zIndex: 10,
          baseSeries: 1,
          tooltip: {
            valueDecimals: 2,
            valueSuffix: "%",
          },
        },
        {
          name: that.settings.Legend,
          type: "column",
          zIndex: 2,
          data: seriesData,
        },
      ],
    });
  }
};

ParetoChartHighChart.prototype.onError = function (errorCallback) {
  this.errorCallback = errorCallback;
};

ParetoChartHighChart.prototype.getEl = function () {
  return this.el;
};

window.EnebularIntelligence.register(
  "paretoChartHighChart",
  ParetoChartHighChart
);

module.exports = ParetoChartHighChart;
