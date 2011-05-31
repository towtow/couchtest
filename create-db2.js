var http = require('http'),
        _ = require('underscore'),
        cu = require('./lib/couch-utils');

const DOC_TYPES = [ 'Foo', 'Far', 'Fur', 'Bar', 'Baz', 'Biz' ];
const NUM_DOCS = 100;

//cu.options.logging = true;

function deleteDB(cont) {
    cu.request('DELETE', '/couchtest', { withResultDo: cont, ignoreFail: true })
}

function createDB(cont) {
    cu.request('PUT', '/couchtest', { withResultDo: cont});
}

function createTestData() {
    _(DOC_TYPES).each(function (type) {
        createBunchOfTestDocsWithType(type);
    });
}

function createBunchOfTestDocsWithType(type) {
    cu.withNewIds(NUM_DOCS, function(uuids) {
        _(uuids).each(function(uuid, idx) {
            cu.request('PUT', '/couchtest/' + uuid, { body: createTestDoc(idx, type) });
        });
    });
}

function createTestDoc(idx, type) {
    return { title: 'Test ' + idx, type: type, num: Math.round(Math.random() * 1000, 0) };
}

function chain(fun, arg) {
    return function() {
        fun(arg);
    }
}

//chain(deleteDB, chain(createDB, createTestData))();
createTestData();

FUCK
https://github.com/towtow/couchtest
