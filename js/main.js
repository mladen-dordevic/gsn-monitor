/*jslint browser: true, devel: true, regexp: true, sloppy: true */
var Utils = (function(window) {
    'use strict';
    /**
     * Returns a type of the parameter passed
     * @method isType
     * @param {} arg
     * @return {String}
     */
    function isType(arg) {
        var obj = {};
        return obj.toString.call(arg).slice(8, -1);
    }
    return {
        isType: isType,
    };
}(window));

//UI module
(function($, window) {
    'use strict';
    $(window.document).ready(function() {
        //asinine control to the toggle button in header
        $('#navbar-toggle-menu').on('click', function() {
            $('#content-menu').slideToggle();
        });
    });
}(window.$, window));

//main module and app logic
var GSN = (function($, g, Utils, window, visible) {
    'use strict';
    var map = null,
        headerSet = false,
        header = [],
        infowindow = null,
        visible = visible || {},
        colorScale = ['#00E540', '#19CE39', '#33B733', '#4CA02C', '#668926', '#7F7220', '#995B19', '#B24413', '#CC2D0C', '#E51606', '#FF0000'];


    /**
     * Class that contains Station data
     * @method Station
     * @param {Array} keyArray
     * @param {Array} valueArray
     * @return {Station} new instance of Station
     */
    //network, station, latitude, longitude, elevation, siteName, startTime, endTime
    function Station(keyArray, valueArray) {
        var i, l;
        this.metrics = {};
        if (Utils.isType(keyArray) !== 'Array') {
            throw new window.Error('First argument in Station constructor expected to be an Array');
        }
        if (Utils.isType(valueArray) !== 'Array') {
            throw new window.Error('Second argument in Station constructor expected to be an Array');
        }
        if (keyArray.length !== valueArray.length) {
            throw new window.Error('Key array needs to have same length as value array');
        }
        //populate values
        for (i = 0, l = keyArray.length; i < l; i += 1) {
            this[keyArray[i]] = valueArray[i].trim();
        }
        return this;
    }
    Station.list = {};
    Station.idToName = {};
    Station.chanellIdtoName = {};
    Station.activChanelId = 3;
    Station.getStationIdsString = function() {
        var id,
            res = [];
        for (id in Station.idToName) {
            res.push(id);
        }
        return res.join('-');
    }

    Station.heatMap = null;
    Station.plotHeatmap = function() {
        var locations = [],
            name;
        for (name in Station.list) {
            locations.push(Station.list[name].marker.getPosition())
        }
        var pointArray = new google.maps.MVCArray(locations);
        Station.heatMap = new g.visualization.HeatmapLayer({
            data: pointArray,
            map: null,
            radius: 100
        });
    }

    Station.toogleHeatmap = function() {
        Station.heatMap.setMap(Station.heatMap.getMap() ? null : map);
    }

    visible.toogleHeatmap = Station.toogleHeatmap;

    /**
     * Creates marker on the map
     */
    Station.prototype.setMarker = function() {
        var self = this;
        this.marker = new g.Marker({
            position: new g.LatLng(+self.latitude, +self.longitude),
            map: map,
            title: self.siteName,
            icon: MapIconMaker.createMarkerIcon({
                width: 28,
                height: 28,
                primaryColor: '#000000',
                cornerColor: '#FFFFFF'
            })
        })
        return this;
    };
    /**
     * Set marker color
     */
    Station.prototype.setMarkerColor = function(color) {
        var self = this,
          activPercentage = 0;
        if( this.metrics[Station.activChanelId] ) {
          activPercentage = this.metrics[Station.activChanelId].percentage;
        }
        var color = color || colorScale[10 - Math.floor(activPercentage/10)],
          url = MapIconMaker.createMarkerIcon({
            width: 28,
            height: 28,
            primaryColor: color,
            cornerColor: color
          });

        this.marker.setIcon(url);
        return this;
    };
    /**
     * Adds event listener to marker
     */
    Station.prototype.addListener = function() {
        var self = this;
        if (this.marker) {
            g.event.addListener(self.marker, 'click', function() {
                if($('#content-menu').is(':visible')){
                  $('#marker-details').html(self.toHtml()[0]);
                } else{
                  infowindow.setContent( self.toHtml()[0]);
                  infowindow.open(map, self.marker);
                }
            })
        }
        return this;
    };
    /**
     * Adds metrics to the station
     */
    Station.prototype.addMetrics = function(obj) {
        this.metrics[Station.activChanelId] = obj;
        return this;
    }
    /**
     * Exports station info as Jquery wraped html bootstrap card so it can be used in info window or else wear
     */
    Station.prototype.toHtml = function() {
        var html = $('<ul class="list-group">').append(
            $('<li class="list-group-item active">').html(this.siteName),
            $('<li class="list-group-item">').html('Network: ' + this.network),
            $('<li class="list-group-item">').html('Station: ' + this.station),
            $('<li class="list-group-item">').html('Latitude: ' + this.latitude),
            $('<li class="list-group-item">').html('Longitude: ' + this.longitude),
            $('<li class="list-group-item">').html('Elevation: ' + this.elevation),
            $('<li class="list-group-item">').html('Start Time: ' + this.startTime),
            $('<li class="list-group-item">').html('End Time: ' + this.endTime),
            $('<li class="list-group-item">').html('<a href="http://ds.iris.edu/mda/II/' + this.station + '" target=_blank>DMC MetaData Aggregator</a>')
          ),
        m;
        for(m in this.metrics){
          var cName = Station.chanellIdtoName[m];
          html.append($('<li class="list-group-item">').html(cName + ': ' + (+this.metrics[m].percentage).toFixed(2) + '%'))
        }
        return html;
    };
    /**
     * Makes AJAX call to get stations info
     * @method getStationsLocations
     */
    function getStationsLocations() {
        /**
         * Successful callback from AJAX call
         * @method callback
         * @param {String} data
         */
        function callback(data) {
            var arrayOfStrings = data.trim().split('\n');
            if (!headerSet) {
                headerSet = true;
                header = arrayOfStrings[0].replace('#', '');
                header = header.split(' | ');
                header.forEach(function(n, i) {
                    header[i] = (n.charAt(0).toLowerCase() + n.slice(1)).trim();
                })
            }
            //remove header row
            arrayOfStrings.shift();
            arrayOfStrings.forEach(function(n) {
                var station = new Station(header, n.split('|')).setMarker().addListener();
                Station.list[station['station']] = station;
            });
            Station.plotHeatmap();
            getStationIds();
        }

        /**
         * AJAX callback on error, handles no data from server or bad URL
         * @method errorCalback
         * @param {} jqXHR
         * @param {} exception
         */
        function errorCalback(jqXHR, exception) {
            if (jqXHR.status === 0) {
                window.console.log('Not connect.\n Verify Network.');
            } else if (jqXHR.status === 404) {
                window.alert('No Stations found');
                window.console.log('Requested page not found. [404]');
            } else if (jqXHR.status === 500) {
                window.console.log('Internal Server Error [500].');
            } else if (exception === 'parsererror') {
                window.console.log('Requested JSON parse failed.');
            } else if (exception === 'timeout') {
                window.console.log('Time out error.');
            } else if (exception === 'abort') {
                window.console.log('Ajax request aborted.');
            } else {
                window.console.log('Uncaught Error.\n' + jqXHR.responseText);
            }
        }

        /**
         * Gets the parameter of the query
         * @method getParameters
         * @return {}
         */
        function getParameters() {
            return {
                net: 'II',
                format: 'text',
                starttime: new Date().toISOString().split('T')[0],
                nodata: '404',
            }
        }

        $.ajax({
            url: 'http://service.iris.edu/fdsnws/station/1/query',
            type: 'GET',
            data: getParameters(),
            success: callback,
            error: errorCalback
        });
    }

    function getStationMetrics() {
        /*
          metric result is in format:
          //stationID/channelID, value, percentage
        */
        function callback(data) {
            data.trim().split('\n').forEach(function(n) {
                var n = n.split(','),
                    name = Station.idToName[n[0]],
                    st = Station.list[name];
                if(st){
                    st.addMetrics({
                        value: n[1] || 0,
                        percentage: n[2] || 0
                    }).setMarkerColor();
                } else {
                  console.log('Station id:' + n[0] + ' name: ' + name + ' does not exist');
                }

            });
            console.log(data);
        }

        function errorCalback(jqXHR, exception) {
            console.log(jqXHR, exception);
        }


        $.ajax({
            url: "http://dqa.ucsd.edu/dqa/cgi-bin/metrics.py",
            type: 'GET',
            data: {
                cmd: "stationgrid",
                param: "station." + Station.getStationIdsString() + "_metric." + Station.activChanelId + "_dates." + '20150601.20150610'
            },
            success: callback,
            error: errorCalback
        });
    }

    function getStationIds() {
        /*
          cmd: options_separated_by_underscore
          options: dates, channelgrid, stationgrid, stationplot, channelplot,
          stations, channels, metrics, groups, grouptypes,

          date format in request is in format:
           20150601.20150610

          response:

          dates > DE, YYYY-MM-DD End date
          dates > DS YYYY-MM-DD  start Date
          grouptypes > T, GroupTypeID, GroupTypeName (Network, Country, etc), Groups associated with Type
          groups > G, GroupID, GroupName (IU, CU, Asia, etc), GroupTypeID
          stations > S, StationID, NetworkID, StationName, groupIDs
          channels > C, ChannelID, ChannelName, LocationName, StationID
          metrics > M, MetricID, MetricName
        */
        function callback(data) {
            data.split('\n').forEach(function(n) {
                var row = n.split(',');
                if (row[0] === 'S') {
                    Station.idToName[row[1]] = row[3];
                    if (Station.list[row[3]]) {
                        Station.list[row[3]].id = row[1];
                    }
                } else if( row[0] === 'M' ) {
                    Station.chanellIdtoName[row[1]] = row[2];
                    var but  = $('<li channelID='+row[1]+'><a href="#">'+row[2]+'</a></li>');
                    but.on('click', function(){
                      var channelID = $(this).attr('channelID');
                      $(this).parent().find('.active').removeClass('active');
                      $(this).addClass('active');
                      Station.activChanelId = +channelID;
                      getStationMetrics();
                      $('#metric-title').html(Station.chanellIdtoName[channelID]);
                    })
                    $('#metrics-channals').append(but);

                    if (Station.list[row[3]]) {
                        Station.list[row[3]].id = row[1];
                    }
                }
            });
            console.log(data);
            getStationMetrics();
        }

        function errorCalback(jqXHR, exception) {
            console.log(jqXHR, exception);
        }


        $.ajax({
            url: "http://dqa.ucsd.edu/dqa/cgi-bin/metrics.py",
            type: 'GET',
            data: {
                cmd: "groups_dates_stations_metrics"
            },
            success: callback,
            error: errorCalback
        });
    }

    /**
     * Initializes google map and controls
     * @method setMap
     * @param {String} mapDiv
     * @return {Map}
     */
    function setMap(mapDiv) {
        var mapOptions = {
            zoom: 3,
            center: new g.LatLng(0, 0),
            panControl: true,
            panControlOptions: {
                position: g.ControlPosition.RIGHT_TOP
            },
            zoomControl: true,
            zoomControlOptions: {
                style: g.ZoomControlStyle.LARGE,
                position: g.ControlPosition.RIGHT_TOP
            },
            scaleControl: true, // fixed to BOTTOM_RIGHT
            streetViewControl: false,
            mapTypeId: g.MapTypeId.ROADMAP,
            styles:[{
                featureType: "all",
                stylers: [
                  { saturation: -100 }
                ]
              },{
                featureType: "road.arterial",
                elementType: "geometry",
                stylers: [
                  { visibility: "off" }
                ]
              },{
                featureType: "poi.business",
                elementType: "labels",
                stylers: [
                  { visibility: "off" }
                ]
              }
            ]
        };
        return new g.Map($(mapDiv)[0], mapOptions);
    }

    $(window.document).ready(function() {
        map = setMap('#map3d');
        infowindow = new g.InfoWindow();
        getStationsLocations();

    });
    return visible;
}(window.$, window.google.maps, Utils, window, GSN));