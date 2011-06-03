var http = require('http'),
        path = require('path'),
        fs = require('fs'),
        _ = require('underscore');

exports.options = { logging: false, host: '127.0.0.1', port: 5984 };

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
    var req = http.request({ host: exports.options.host, port: exports.options.port, path: path, method: method, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Accept': 'application/json', 'Accept-Charset': 'utf-8'} },
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

function includeFile(basePath, relFilePath, result) {
    var fp = path.join(basePath, relFilePath);
    try {
        if (fs.statSync(fp).isDirectory()) {
            console.info('Directory include: ' + fp + '.');
            fp = path.join(fp, 'index.js');
        }
    } catch(e) {
        fp += '.js';
    }
    if (result[fp]) return result;
    var contents = fs.readFileSync(fp, 'utf8');
    result[fp] = contents;
    _(requiredBy(contents)).each(function(match) {
        if (match[0] === '.') {
            includeFile(path.dirname(fp), match, result);
        } else {
            console.info('File ' + fp + ' requires global lib "' + match + '".');
        }
    });
    return result;
}

function requiredBy(script) {
    var exp = /\srequire\s*\(['"]([a-zA-Z0-9_./]+)['"]\)/g,
            matches = [],
            match;
    while (match = exp.exec(script)) {
        matches.push(match[1]);
    }
    return matches;
}

function includeLib(moduleName, ddoc) {
    var bbP = path.join(__dirname, '..', 'node_modules');
    var basePath = path.join(bbP, moduleName);
    var pkg = JSON.parse(fs.readFileSync(path.join(basePath, 'package.json'), 'utf8'));
    var result = includeFile(basePath, pkg.main, {});
    ddoc.lib = ddoc.lib || {};
    var p, propPath, t, vn, x = ddoc.lib;
    for (p in result) {
        propPath = p.substr(bbP.length + 1).replace(/\.js$/, '').split('/');
        vn = propPath.pop();
        t = x;
        _(propPath).each(function(it) {
            t[it] = t[it] || {};
            t = t[it];
        });
        t[vn] = result[p];
    }
    ddoc[moduleName] = "module.exports = require('lib/" + moduleName + "/" + pkg.main.replace(/^\.\//, '').replace(/\.js$/, '') + "');"
}

exports.includeLib = includeLib;
