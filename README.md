# GSN Monitor too

## Overview

Simple monitor tools that gives geo-spacial overview of various station metrics.
User can select from drop-down button which metric does he want to observe. App will make and AJAX get
request to DQA database to retrieve information and station markers will assume appropriate color.

##TODO
*Date range for metrics needs to be updated automatically, right now it is a fixed start-end range due to not receiving any information from database for current day interval.
*Set getMetrics function in setInterval once above problem is solved.
*Other things to do?
