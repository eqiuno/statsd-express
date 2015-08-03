/**
 *
 * It's an express middleware to record request performance data to statsd
 *
 *
 */

var onfinished = require('on-finished'),
    lynx       = require('lynx');
/**
 *  @param {string} host statsd host, default 127.0.0.1
 *  @param {integer} port statsd port, default 8125
 *  @return {object} express middleware
 */
exports        = module.exports = function (host, port) {
    if (!host || typeof host === 'number') {
        host = '127.0.0.1';
        port = host;
    }

    if (!port || typeof port !== 'number') {
        port = 8125;
    }

    var client = new lynx(host, port);

    return function (req, res, next) {
        var _start  = new Date();
        var _urlKey = _key(req);
        onfinished(res, function (err, req) {
            var respTime = new Date() - _start;
            client.timing(_urlKey, respTime);
            client.count(_urlKey, 1);
            client.count(res.status, 1);
        });
        next();
    };

    function _key(req) {
        var url = req.originalUrl;
        url     = url.replace('/', '.');
        return req.status + '.' + url;
    }
};
