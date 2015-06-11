# iris_dev_exercise

## Web Application Features

1. When user click anywhere on the map (except marker) GET request is made to the web server requesting informations about 500 ( or 100 on mobile device ) most recent events within 1000km (~9 deg.) radius from clicked location.
2. Depending on the zoom level different magnitudes are displayed in attempt to get cleaner map.
3. Earthquake events are  color coded for depth and size coded for magnitude.
4. Upon events retrieval from server, search perimeter is centered in the map view.
5. Clicking on the individual event marker will bring more details about the event.

## Web Application Future improvements

1. Instead of user being able to control only two parameters of the query ( Latitude and Longitude ) allow him to refine his search by putting constriction on other parameters such as start/end time, min/max depth, min/max magnitude etc.
2. Instead of search being trigger on single click possibly explore other methods for example double click as this would minimize accidental clicks on the map
3. Link it to the other IRIS products as [Event table](http://ds.iris.edu/ieb/evtable.phtml) and [3D Earthquakes Viewer](http://ds.iris.edu/3dv/index.html)
4. For larger number events (> 500 ) marker icons that are circular path are not practical due to low response, instead use customized png icons.
5. More meaningful depth color coding scale to reflect Earth layers.
5. Cache events to improve loading time.
6. Could do interesting things with weighted heat map of larger number of events.

## Work flow

1. Upon user click on the map GET request is made using clicked location as the parameters for search.
2. Until results are displayed on the map any future GET is disabled.
3. On JQuery Ajax success callback string data are trimmed and striped of the column names row.
4. Rest of the data is split on new line and asynchronously used to create EarthQuake objects with column names.as properties and line split by | as appropriate values.
5. Markers are created and assigned to the map.
6. On each marker event is added so it displays appropriate informations when clicked.

## Assumptions

1. jQuery and Bootstrap are used in IRIS web page so they could already be cashed in user browser.
2. EarthQuake Class and Utils module moved from its file to main.js to minimize number of files called.
3. Text instead of xml format used in events GET as it is significantly smaller that xml.
4. Modular pattern and closure used to minimize application footprint in global name-space.
5. Header row in text format GET does not change.
6. If mobile platform detected reduce maximal number of events retrieved.