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
    if (process.argv.length === 3) {
        return console.log(yield sysdigClient[process.argv[2]]());
    }

    assert('username' in (yield sysdigClient.getUserInfo()));

    assert((yield sysdigClient.getConnectedAgents()).constructor === Array);
    assert((yield sysdigClient.getAlerts()).constructor === Array);

    assert((yield sysdigClient.getExploreGroupingHierarchy()).constructor === Array);

    assert((yield sysdigClient.getExploreGroupingHierarchy()).constructor === Array);

    /* None of them work right now: */

    //assert((yield sysdigClient.getNotifications()).constructor === Array);
    console.log(yield sysdigClient.getDataRetentionInfo())
    //console.log(yield sysdigClient.getDashboards())
})();
