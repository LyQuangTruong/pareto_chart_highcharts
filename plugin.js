var d3 = require('d3')
var Highcharts = require('highcharts');

var colData = [];
var tempSeries=[];

ScatterChart.defaultSettings = {
    "VerticalAxis": "temperature",
    "MaxV": "100",
    "MinV": "0",
    "HorizontalAxis": "humidity",
    "MaxH": "100",
    "MinH": "0",
    "Legend": "Place",
    "Timestamp": "ts",
    "Limit": "10",
    "Tooltip": [{
            "tag":"pressure"
        }, {
            "tag":"DeviceName"
        }]
};

ScatterChart.settings = EnebularIntelligence.SchemaProcessor([{
    type: "key",
    name: "VerticalAxis"
}, {
    type: "text",
    name: "MaxV"
}, {
    type: "text",
    name: "MinV"
}, {
    type: "key",
    name: "HorizontalAxis"
}, {
    type: "text",
    name: "MaxH"
}, {
    type: "text",
    name: "MinH"
}, {
    type: 'key',
    name: 'Legend'
}, {
    type: 'text',
    name: 'Timestamp'
}, {
    type: "select",
    name: "Limit",
    options: ["10", "20", "30", "all"]
}, {
    type: 'list',
    name: 'Tooltip',
    "children": [{
        "type": "text",
        "name": "tag"
        }]
}], ScatterChart.defaultSettings);

function createScatterChart(that) {
    if(tempSeries != []) tempSeries = [];
    ConvertDataAPI(tooltipCheckExist, vertical, horizontal, timestamp);
    
    that.scatterChartC3 = Highcharts.chart('root', {
        chart: {
            type: 'scatter',
            zoomType: 'xy'
        },
        title:{
            text: null
        },
        xAxis: {
            title: {
                enabled: true,
                text: that.settings.HorizontalAxis
            },                
            min: parseInt(that.settings.MinH),
            max: parseInt(that.settings.MaxH)  
        },
        yAxis: {
            title: {
                enabled: true,
                text: that.settings.VerticalAxis
            }, 
            min: parseInt(that.settings.MinV),
            max: parseInt(that.settings.MaxV)
        },
        legend: {
            layout: 'vertical',
            align: 'left',
            verticalAlign: 'top',
            x: 75,
            y: 0,
            floating: true,
            backgroundColor: Highcharts.defaultOptions.chart.backgroundColor,
            borderWidth: 1
        },
        plotOptions: {
            scatter: {
                marker: {
                    radius: 5,
                    states: {
                        hover: {
                            enabled: true,
                            lineColor: 'rgb(100,100,100)'
                        }
                    }
                },
                states: {
                    hover: {
                        marker: {
                            enabled: false
                        }
                    }
                },
                tooltip: {
                    headerFormat: '',
                    pointFormatter: function() {
                        var pointChart = this.series.userOptions;
                        var tool_str = that.settings.Legend + ': ' + pointChart.name 
                                    + '<br>' + that.settings.VerticalAxis + ': ' + pointChart.data[this.index][1]
                                    + '<br>' + that.settings.HorizontalAxis + ': ' + pointChart.data[this.index][0];


                        var dateObj = new Date(pointChart.ts[this.index]);
                        var timeDate = '';
                        var minutes = dateObj.getMinutes();
                        minutes = minutes > 9 ? minutes : '0' + minutes;
                        if (!isNaN(dateObj.getTime())) {
                            timeDate = (dateObj.getMonth() + 1) + '/' + dateObj.getDate() + " " + dateObj.getHours() + ':' + minutes;
                        } else {
                            timeDate = pointChart.ts[this.index];
                        } 
                        if(timestamp) tool_str += '<br>' + that.settings.Timestamp + ': ' + timeDate;
                        var arr_tmp = pointChart.tooltipArr[this.index];
                        tooltipCheckExist.forEach(function(val, i) {
                            tool_str += '<br>' + val + ': ' + arr_tmp[i];
                        })
                        return tool_str;
                    } 
                }
            }
        },
        series: tempSeries
    });
}

function ScatterChart(settings, options) {
    var that = this;
    this.el = window.document.createElement('div');
    this.el.id = "chart";

    this.settings = settings;
    this.options = options;
    this.data = [];
    this.maxNumber = 0;
    this.minNumber = 0;

    this.width = options.width || 700;
    this.height = (options.height || 500);

    this.margin = { top: 20, right: 80, bottom: 30, left: 50 }

    this.z = ["#70C1B3", "#247BA0", "#FFE066", "#F25F5C", "#50514F", "#F45B69", "#211103", "#5C8001", "#23395B", "#470063"];

    setTimeout(function() {
        createScatterChart(that);
    }, 100);

}

ScatterChart.prototype.addData = function(data) {
    var that = this;

    function fireError(err) {
        if (that.errorCallback) {
            that.errorCallback({
                error: err
            })
        }
    }

    if (data instanceof Array) {
        var temperature = this.settings.VerticalAxis
        var humidity = this.settings.HorizontalAxis
        var legend = this.settings.Legend
        var timestamp = this.settings.Timestamp
        var limit = this.settings.Limit
        

        this.filteredData = data
            .filter(d => {
                let hasLabel = d.hasOwnProperty(temperature)
                const dLabel = d[temperature]
                if (typeof dLabel !== 'string' && typeof dLabel !== 'number') {
                    fireError('VerticalAxis is not a string or number')
                    hasLabel = false
                }
                return hasLabel
            })
            .filter(d => {
                let hasLabel = d.hasOwnProperty(humidity)
                const dLabel = d[humidity]
                if (typeof dLabel !== 'string' && typeof dLabel !== 'number') {
                    fireError('HorizontalAxis is not a string or number')
                    hasLabel = false
                }
                return hasLabel
            })
            .filter(d => {
                let hasLabel = d.hasOwnProperty(legend)
                const dLabel = d[legend]
                if (typeof dLabel !== 'string' && typeof dLabel !== 'number') {
                    fireError('legend is not a string or number')
                    hasLabel = false
                }
                return hasLabel
            })            
            .filter(d => {
                let hasTs = d.hasOwnProperty(timestamp)
                if (isNaN(d[timestamp])) {
                    fireError('timestamp is not a number')
                    hasTs = false
                }
                return hasTs
            })
            .sort((a, b) => b.timestamp - a.timestamp)

        if (this.filteredData.length === 0) {
            return
        }
        this.data = d3.nest()
            .key(function(d) {
                return d[legend];
            })
            .entries(this.filteredData)
            .map(function(d, i) {
                d.values = d.values.filter(function(dd, ii) {
                    if (!isNaN(limit))
                        return ii < limit;
                    return ii;
                })
                return d;
            })
            .sort(function(a, b) {
                if (a.key < b.key) return -1;
                if (a.key > b.key) return 1;
                return 0;
            })
        this.convertData();
    } else {
        fireError('no data')
    }

}

ScatterChart.prototype.clearData = function() {
    this.data = {};
    colData = [];
    tempSeries = [];
    this.refresh();
}

ScatterChart.prototype.convertData = function() {
    colData = this.data;
    this.refresh();
}

var tooltipCheckExist = [];
var vertical = '';
var horizontal = '';
var timestamp = '';

function ConvertDataAPI(tooltipCheckExist, vertical, horizontal, timestamp) {
    tempSeries = [];
    colData.forEach(function(val,index){
        var dataVal = [];
        var tooltipVal = [];

        var tsArr = [];
        
        for(var i = 0; i < val.values.length; i++) {
            var temp = [];
            temp.push(colData[index]["values"][i][horizontal], colData[index]["values"][i][vertical]);
            dataVal.push(temp);

            tsArr.push(colData[index]["values"][i][timestamp]); 

            var tempArr = [];
            tooltipCheckExist.forEach(function(element) {
                tempArr.push(colData[index]["values"][i][element])
            })
            tooltipVal.push(tempArr);            
        }
        tempSeries.push({
            'data':dataVal,
            'name':colData[index]["key"],
            'ts': tsArr,
            'tooltipArr' : tooltipVal
        });
    });
}

ScatterChart.prototype.resize = function(options) {
    this.width = options.width;
    this.height = options.height - 50;
}

var defaultData = [];
ScatterChart.prototype.refresh = function() {
    var that = this;
    tooltipCheckExist = [];
    colData.forEach(function(val){
        for(var i = 0; i < val.values.length; i++) {
            that.settings.Tooltip.forEach(function(tooltip) {
                var toolTipVal = tooltip.value;
                if(toolTipVal == null) toolTipVal = tooltip.tag;
                if(val.values[i].hasOwnProperty(toolTipVal)) {
                    if(!tooltipCheckExist.includes(toolTipVal))
                        tooltipCheckExist.push(toolTipVal);
                }
            })
        }
    });
    vertical = that.settings.VerticalAxis;
    horizontal = that.settings.HorizontalAxis;
    timestamp = that.settings.Timestamp;
    ConvertDataAPI(tooltipCheckExist, vertical, horizontal,timestamp);

    if (this.axisX) this.axisX.remove()
    if (this.axisY) this.axisY.remove()
    if (this.yText) this.yText.remove()

    if(tempSeries.length > 0 && defaultData.length == 0) {
        tempSeries.forEach(function(val, i) {
            var temp_data = ['',''];
            var temp_name = val.name;
            var temp_ts = [''];

            defaultData.push({
                data: temp_data,
                name: temp_name,
                ts: temp_ts
            })
        })
    }
    if(tempSeries.length == 0 && defaultData.length > 0) tempSeries = defaultData;
  
    if (that.scatterChartC3) {
        that.scatterChartC3 = Highcharts.chart('root', {
            chart: {
                type: 'scatter',
                zoomType: 'xy'
            },
            title:{
                text: null
            },
            xAxis: {
                title: {
                    enabled: true,
                    text: that.settings.HorizontalAxis
                },                
                min: parseInt(that.settings.MinH),
                max: parseInt(that.settings.MaxH)  
            },
            yAxis: {
                title: {
                    enabled: true,
                    text: that.settings.VerticalAxis
                }, 
                min: parseInt(that.settings.MinV),
                max: parseInt(that.settings.MaxV)
            },
            legend: {
                layout: 'vertical',
                align: 'left',
                verticalAlign: 'top',
                x: 75,
                y: 0,
                floating: true,
                backgroundColor: Highcharts.defaultOptions.chart.backgroundColor,
                borderWidth: 1
            },
            plotOptions: {
                scatter: {
                    marker: {
                        radius: 5,
                        states: {
                            hover: {
                                enabled: true,
                                lineColor: 'rgb(100,100,100)'
                            }
                        }
                    },
                    states: {
                        hover: {
                            marker: {
                                enabled: false
                            }
                        }
                    },
                    tooltip: {
                        headerFormat: '',
                        pointFormatter: function() {
                            var pointChart = this.series.userOptions;
                            var tool_str = that.settings.Legend + ': ' + pointChart.name 
                                        + '<br>' + that.settings.VerticalAxis + ': ' + pointChart.data[this.index][1]
                                        + '<br>' + that.settings.HorizontalAxis + ': ' + pointChart.data[this.index][0];


                            var dateObj = new Date(pointChart.ts[this.index]);
                            var timeDate = '';
                            var minutes = dateObj.getMinutes();
                            minutes = minutes > 9 ? minutes : '0' + minutes;
                            if (!isNaN(dateObj.getTime())) {
                                timeDate = (dateObj.getMonth() + 1) + '/' + dateObj.getDate() + " " + dateObj.getHours() + ':' + minutes
                            } else {
                                timeDate = pointChart.ts[this.index];
                            } 
                            if(timestamp) tool_str += '<br>' + that.settings.Timestamp + ': ' + timeDate;
                            var arr_tmp = pointChart.tooltipArr[this.index];
                            tooltipCheckExist.forEach(function(val, i) {
                                tool_str += '<br>' + val + ': ' + arr_tmp[i];
                            })
                            return tool_str;
                        } 
                    }
                }
            },
            series: tempSeries
        });
    }
}

ScatterChart.prototype.onError = function(errorCallback) {
    this.errorCallback = errorCallback
}

ScatterChart.prototype.getEl = function() {
    return this.el;
}

window.EnebularIntelligence.register('scatterchart', ScatterChart);

module.exports = ScatterChart;