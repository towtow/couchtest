var http = require('http'),
        _ = require('underscore'),
        cu = require('./lib/couch-utils');

const DOC_TYPES = [ 'Foo', 'Far', 'Fur', 'Bar', 'Baz', 'Biz' ];
const NUM_DOCS = 1000;

//cu.options.logging = true;
cu.options.host = 'hadoop.ref.dc.local';

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

function createTestMessage(idx) {
    return {
        timestamp: new Date().getTime(),
        type: "message",
        from: "me@local",
        to: [ "nlj", "pn" ],
        cc: [ "ck", "astu" ],
        subject: "Teschding " + idx, message: "empty",
        confidential: false };
}


function createSomeMessages() {
    var count = 1000;
    while (count) {
        cu.request('POST', '/couchtest', { body: createTestMessage(count) });
        count -= 1;
    }
}


//chain(deleteDB, chain(createDB, createTestData))();
//createTestData();
createSomeMessages();
