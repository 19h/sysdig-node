'use strict';

const assert = require('assert');

const Promise = require('bluebird');

class SysdigClient {
    constructor ({sdcToken, sdcUrl}, {transport}) {
        this._sdcUrl = sdcUrl;

        this._dependencies = {
            /*
                This looks like shit, but it accomplishes that
                the token cannot be accessed from the outside.
            */
            transport: (args => {
                args.headers = this._buildAuthorizationFromToken(sdcToken);

                return transport.request(args);
            })
        };

        this._types = {
            number: 1,
            string: 2
        };
    }

    _buildAuthorizationFromToken (sdcToken) {
        return {
            'Authorization': `Bearer ${sdcToken}`
        };
    }

    * _transportRequest ({method, path, params, body}) {
        try {
            return yield this._dependencies.transport({
                apiUrl: this._sdcUrl,

                /* URI */
                method, path,

                /* modifiers */
                params, body
            });
        } catch(err) {
            throw new Error(`<${method}: ${path}>: ${err.message}`);
        }
    }

    * _checkedRequest (args) {
        const apiResponse = yield* this._transportRequest(args);

        if ('errors' in apiResponse) {
            const serializedErrors = apiResponse.errors.map(({reason, message}) =>
                `${reason}: ${message}\n`
            );

            throw new Error(`Sysdig API error: (bug report? https://github.com/KenanSulayman/sysdig-node)\n${serializedErrors}`);
        }

        return apiResponse;
    }

    * _request (args) {
        return yield* this._checkedRequest(args);
    }

    _checkMandatoryArguments (args) {
        args.some(([type, name, arg]) => {
            const message = type => `Mandatory parameter '${name}' must be a ${type}.`;

            switch(type) {
                case this._types.number:
                    assert (!isNaN(arg), message('number'));
                    break;
                case this._types.string:
                    assert (arg.constructor === String, message('string'));
                    break;
            }
        })
    }

    _assert (cond, msg) {
        assert(cond, `API Error: ${msg}`);
    }
}

/*
    Sorry for this. I just don't want to expose raw
    generators as API to the user. Promises are more
    user-friendly.

    Each generator will be wrapped as a coroutine
    which provides a Promise interface and delegates
    to internal generators.
*/
[
    {
        name: 'getUserInfo',
        * fn () {
            return (yield* this._request({
                method: 'get',
                path: '/api/user/me'
            })).user;
        }
    },
    {
        name: 'getConnectedAgents',
        * fn () {
            return (yield* this._request({
                method: 'get',
                path: '/api/agents/connected'
            })).agents;
        }
    },
    {
        name: 'getAlerts',
        * fn () {
            return (yield* this._request({
                method: 'get',
                path: '/api/alerts'
            })).alerts;
        }
    },
    {
        name: 'getExploreGroupingHierarchy',
        * fn () {
            const groupConfigurations = (yield* this._request({
                method: 'get',
                path: '/api/groupConfigurations'
            })).groupConfigurations;

            this._assert(groupConfigurations, 'Error: groupConfigurations is missing!');

            let groupingHierarchy;

            /* some lets us bail early w/o needing a loop */
            groupConfigurations.some(groupConfiguration => {
                if (groupConfiguration.id !== 'explore') {
                    return false;
                }

                /* TODO: This *really* looks evil. Replace with lodash? */
                const items = groupConfiguration.groups[0].groupBy;

                groupingHierarchy = items.map(item => item.metric);

                return true;
            });

            this._assert(groupingHierarchy, 'Error: bad groupConfiguration: no `explore` entry!')

            return groupingHierarchy;
        }
    },
    {
        name: 'getDataRetentionInfo',
        * fn () {
            return (yield* this._request({
                method: 'get',
                path: '/api/history/timelines/'
            }));
        }
    },
    {
        name: 'getDashboards',
        * fn () {
            return (yield* this._request({
                method: 'get',
                path: '/ui/dashboards'
            })).dashboards;
        }
    },
    {
        name: 'getViewsList',
        * fn () {
            return (yield* this._request({
                method: 'get',
                path: '/data/drilldownDashboardDescriptors.json'
            }));
        }
    },
    {
        name: 'getMetrics',
        * fn () {
            return (yield* this._request({
                method: 'get',
                path: '/api/data/metrics'
            }));
        }
    },
    {
        name: 'getSysdigCaptures',
        * fn () {
            return (yield* this._request({
                method: 'get',
                path: '/api/sysdig'
            }));
        }
    },
].forEach(({name, fn, hidden}) => {
    if (hidden) return;

    SysdigClient.prototype[name] = Promise.coroutine(fn);
});

module.exports = SysdigClient;
