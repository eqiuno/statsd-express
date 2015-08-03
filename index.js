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
 *  @param {object} options
 *  @return {object} express middleware
 */
exports        = module.exports = function (host, port, memory, reqKey, customized) {
    if (!host || typeof host === 'number') {
        host = '127.0.0.1';
        port = host;
    }

    if (!port || typeof port !== 'number') {
        port = 8125;
    }

    var client = new lynx(host, port);

    if (memory) {
        var host = os.hostname();
        recordMemory();
    }

    function recordMemory() {
        var usage = process.memoryUsage();
        client.count(host + '.vss', usage.rss);
        client.count(host + '.heapUsed', usage.heapUsed);
        client.count(host + '.heapUsage', usage.heapTotal);
        setTimeout(recordMemory, 10000);
    }

    return function (req, res, next) {
        var _start    = new Date();
        var keyMethod = _key;
        if (reqKey && typeof reqKey === 'function') {
            keyMethod = reqKey;
        }
        var _urlKey = keyMethod.call({}, req, res);
        onfinished(res, function (err, res) {
            var respTime = new Date() - _start;
            client.timing(_urlKey, respTime);
            client.count(_urlKey, 1);
            client.count(res.status, 1);

            if (customized && typeof customized === 'function') {
                customized.call({}, res);
            }
        });
        next();
    };

    function _key(req) {
        var url = req.originalUrl;
        url     = url.replace('/', '.');
        return req.status + '.' + url;
    }
};
