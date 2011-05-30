var http = require('http'),
        _ = require('underscore');

exports.options = { logging: false };

function failed(res) {
    return res.statusCode < 200 || res.statusCode >= 300;
}

function request(method, path, options) {
    var reqBodyObject = options && options.body;
    var resClosure = options && options.withResultDo;
    var ignoreFail = !!options.ignoreFail;
    if (exports.options.logging) {
        console.log('>>> Request ' + method + ' ' + path + (reqBodyObject ? ' with ' + JSON.stringify(reqBodyObject) : ' with empty body' ));
    }
    var req = http.request({ host: '127.0.0.1', port: 5984, path: path, method: method, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Accept': 'application/json', 'Accept-Charset': 'utf-8'} },
            function (res) {
                if (exports.options.logging) {
                    console.log('<<< Response ' + res.statusCode);
                }
                if (!ignoreFail && failed(res)) {
                    throw new Error("Request " + method + " " + path + " failed with response status " + res.statusCode);
                }
                res.setEncoding('utf8');
                var body = "";
                res.on('data', function (chunk) {
                    body += chunk;
                });
                res.on('end', function () {
                    if (resClosure) {
                        resClosure(JSON.parse(body));
                    }
                });
            });
    req.on('error', function (err) {
        throw err;
    });
    if (reqBodyObject) {
        req.write(JSON.stringify(reqBodyObject));
    }
    req.end();
}
exports.request = request;

function withNewIds(count, resClosure) {
    request('GET', '/_uuids?count=' + count, { withResultDo: function (res) {
                resClosure(res.uuids);
            } });
}
exports.withNewIds = withNewIds;
