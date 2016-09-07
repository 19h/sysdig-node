'use strict';

const https = require('https');
const url = require('url');

const Promise = require('bluebird');

const httpsRequestAsync = args => {
    return new Promise((resolve, reject) => {
        let buf = new Buffer(0);

        https.request(args, sock => {
            sock.on('data', msg => {
                buf = Buffer.concat([buf, msg]);
            });

            sock.on('end', () => resolve(buf));
            sock.on('error', err => reject(err));
        }).end();
    });
};

class HttpTransport {
    constructor ({client}) {
        this._client = client;
    }

    * _tryRequest (requestArgs) {
        try {
            return yield this._client(requestArgs);
        } catch(err) {
            throw new Error(`Could not parse API response. Original error: ${err}`);
        }
    }

    _safeParse (rawApiResponse, host) {
        try {
            return JSON.parse(rawApiResponse.toString());
        } catch(err) {
            throw new Error(`Invalid JSON was returned. Did you set an invalid endpoint? (host is '${host}')`);
        }
    }

    * _safeRequest (requestArgs) {
        const rawApiResponse = yield* this._tryRequest(requestArgs);

        /* The host isn't needed, but it makes for a nicer error message. */
        const apiResponse = this._safeParse(rawApiResponse, requestArgs.host);

        if (!('error' in apiResponse)) {
            return apiResponse;
        }

        const {status, error, message} = apiResponse;

        throw new Error(`API Error: [${status}] ${error}: ${message}`);
    }
}

/*
    I want transports to be exporting Promises so
    its easier for developers to write them!
*/
HttpTransport.prototype.request = Promise.coroutine(function* ({
    apiUrl, method, path, headers, params, body
}) {
    const parsedUrl = url.parse(apiUrl);

    const requestArgs = {
        path, headers, host: parsedUrl.host
    };

    return yield* this._safeRequest(requestArgs);
});

module.exports = new HttpTransport({
    client: httpsRequestAsync
});

module.exports.HttpTransport = HttpTransport;
