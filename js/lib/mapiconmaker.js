/**
 * MapIconMaker v1.0
 * Copyright (c) 2008 Pamela Fox
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 *
 *  Author: Pamela Fox
 *
 *  This gives you static function(s) for creating dynamically sized and
 *  colored marker icons using the Charts API marker output.
 */

var MapIconMaker = {};

MapIconMaker.createMarkerIcon = function(opts) {
  var opts = opts || {};
  var width = opts.width || 32;
  var height = opts.height || 32;
  var primaryColor = opts.primaryColor || "#ff0000";
  var strokeColor = opts.strokeColor || "#000000";
  var cornerColor = opts.cornerColor || "#ffffff";

  var baseUrl = "http://chart.apis.google.com/chart?cht=mm";
  var iconUrl = baseUrl + "&chs=" + width + "x" + height +
      "&chco=" + cornerColor.replace("#", "") + "," + primaryColor.replace("#", "") + "," + strokeColor.replace("#", "") + "&ext=.png";

  return iconUrl;
}
