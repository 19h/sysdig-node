'use strict';

const assert = require('assert');

const Promise = require('bluebird');

const sysdig = require('./lib'); // sydig
const sysdigHttpTransport = require('./http-transport');

const sysdigClient = sysdig.transport(sysdigHttpTransport).config({
    //sdcToken: 'foobar',
    // optional
    //sdcUrl: 'https://google.com'
});

Promise.coroutine(function* () {
    assert('username' in (yield sysdigClient.getUserInfo()));

    assert((yield sysdigClient.getConnectedAgents()).constructor === Array);
    assert((yield sysdigClient.getAlerts()).constructor === Array);

    /* None of them work right now: */

    //assert((yield sysdigClient.getNotifications()).constructor === Array);
    //console.log(yield sysdigClient.getExploreGroupingHierarchy())
    //console.log(yield sysdigClient.getDataRetentionInfo())
    //console.log(yield sysdigClient.getDashboards())
})();
