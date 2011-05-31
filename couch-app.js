var couchapp = require('couchapp'),
        path = require('path');

function includeLib(relPath) {
    return require('fs').readFileSync(path.join(__dirname, relPath), 'utf8');
}

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
        msg: {
            map: function(doc) {
                if (doc.type === 'message') {
                    emit(doc._id, doc);
                }
            },
            reduce: function(keys, values, combine) {
                if (combine) {
                    return sum(values);
                } else {
                    return values.length;
                }
            }
        },
        count: {
            map: function(doc) {
                if (doc.type) {
                    emit([doc.type, parseInt(doc.num / 100) * 100, parseInt(doc.num % 10)]);
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
    },
    shows: {
        ui: function(doc, req) {
            var _ = require('lib/underscore');
            var context = doc || this.default_context;
            var template = (doc && doc.template) || this.template;
            // For some reason templates want a final line with a token in the first column.
            template += "\n// end";
            var result = jade.render(template, { debug: true, locals: context, filename: "jade-template" });
            return { code: 200, headers: { "Content-Type": "text/html" }, body: result };
        }
    },
    lib: {
        underscore: includeLib('node_modules/underscore/underscore.js')
    },
    template: "!!! 5\nhtml\n  body\n    h1= title",
    default_context: {
        style: "font-style: italic; font-size: 115%",
        message: "Welcome to <a href='http://github.com/jhs/jade-couchdb'>Jade CouchDB</a>! How simple was that? Try <a href='./ui/red'>red Jade</a> too.",
        title: "Jade CouchDB"
    }
};

couchapp.loadAttachments(ddoc, path.join(__dirname, 'attachments'));

couchapp.createApp(ddoc, 'http://localhost:5984/couchtest', function (app) {
    app.push();
});
