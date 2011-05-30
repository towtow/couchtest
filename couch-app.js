var couchapp = require('couchapp'),
        path = require('path');

var ddoc = {
    _id: '_design/app',
    language: 'javascript',
    validate_doc_update: function (newDoc, oldDoc, userCtx) {
        if (newDoc._deleted === true && userCtx.roles.indexOf('_admin') === -1) {
            throw "Only admin can delete documents on this database.";
        }
    },
    rewrites: [
        {from:"/", to:'index.html'},
        {from:"/api", to:'../../'},
        {from:"/api/*", to:'../../*'},
        {from:"/*", to:'*'}
    ],
    views: {
        count: {
            map: function(doc) {
                if (doc.type) {
                    emit([doc.type, parseInt(doc.num / 100) * 100, parseInt(doc.num % 12)]);
                }
            },
            reduce: function(keys, values, combine) {
                if (combine) {
                    return sum(values);
                } else {
                    return values.length;
                }
            }
        }
    }
};
couchapp.loadAttachments(ddoc, path.join(__dirname, 'attachments'));

couchapp.createApp(ddoc, 'http://root:root@localhost:5984/couchtest', function (app) {
    app.push();
});
