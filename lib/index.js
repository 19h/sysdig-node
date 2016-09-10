'use strict';

/*
    This file is used for arbitrating the
    SysdigClient dependencies and configuration.
*/

const assert = require('assert');

const SDC_URL = 'https://app.sysdigcloud.com';

/*
    when called from a foreign directory directly,
    make sure we do not alias to an invalid direct-
    ory.
*/

const SysdigClient = require('./sysdig-client');

class Sysdig {
    constructor({SysdigClient}) {
        this.dependencies = {
            SysdigClient
        };
    }

    transport (transport) {
        this._sysdigTransport = transport;

        // Allow chaining config and transport
        return this;
    }

    config ({sdcToken, sdcUrl}) {
        assert(this._sysdigTransport, 'You must pass a valid transport first!');

        return this._setupClient({sdcToken, sdcUrl});
    }

    _setupClient ({sdcToken, sdcUrl}) {
        /* yeah, we do not in any case want to leak the apiToken */
        const resolvedSdcToken = this._arbitrateApiToken(sdcToken);
        const resolvedSdcUrl = this._arbitrateSdcUrl(sdcUrl);

        return new SysdigClient({
            sdcToken: resolvedSdcToken,
            sdcUrl: resolvedSdcUrl
        }, {
            transport: this._sysdigTransport
        });
    }

    _arbitrateApiToken (sdcToken) {
        /*
            Try in order:
                1) explicitly passed sdcToken
                2) SDC_TOKEN environment variable
        */
        const resolvedSdcToken = sdcToken || process.env.SDC_TOKEN;

        if (resolvedSdcToken) {
            return resolvedSdcToken;
        }

        throw new Error('No token set. Please pass a token or use the SDC_TOKEN environment variable.');
    }

    _arbitrateSdcUrl (sdcUrl) {
        /*
            Try in order:
                1) explicitly passed sdcUrl
                2) SDC_URL environment variable
                3) fallback to default
        */

        return sdcUrl || process.env.SDC_URL || SDC_URL;
    }
}

module.exports = new Sysdig({SysdigClient});
module.exports.Sysdig = Sysdig;
