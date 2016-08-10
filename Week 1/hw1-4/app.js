var express = require('express'),
    app = express(),
    engines = require('consolidate'),
    MongoClient = require('mongodb').MongoClient,
    bodyParser = require('body-parser'),
    assert = require('assert');

app.engine('html', engines.nunjucks);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res, next) => {
    var render = (db, callback) => {
        db.collection('movies').find({}).toArray((err, docs) => {
            res.render('entries', { 'movies' : docs });
        }, (err, result) => {
            assert.equal(err, null);
            console.log("Successfully rendered entries.html");
            callback();
        });
    };
    MongoClient.connect('mongodb://localhost:27017/video', (err, db) => {
        assert.equal(null, err);
        console.log("Successfully connected to MongoDB.");
        render(db, () => {
            db.close();
        });
    });
});

app.get('/insertEntry', (req, res, next) => {
    res.render('insertEntry');
});

app.post('/insertEntry/post_movie', (req, res, next) => {
    var title = req.body.title;
    var year = req.body.year;
    var imdb = req.body.imdb;
    var insertMovie = (db, callback) => {
                        db.collection('movies').insertOne({
                            "title":title,
                            "year": Number(year),
                            "imdb": imdb
                        }, (err, result) => {
                            assert.equal(err, null);
                            console.log("Inserted a document into the movies collection.");
                            callback();
                        });
                    };
    if (typeof title == 'undefined' || typeof year == 'undefined' || typeof imdb == 'undefined') {
        next('Please fill in all three input fields');
    } else {
        MongoClient.connect('mongodb://localhost:27017/video', (err, db) => {
            assert.equal(null, err);
            console.log("Successfully connected to MongoDB.");
            insertMovie(db, () => {
                db.close();
            });
        });
        res.redirect('/');
    }
});

app.use((err, req, res, next) => {
    console.log(err.message);
    console.log(err.stack);
    res.status(500).render('error_template', { error: err });
});

app.use((req, res) => {
    res.sendStatus(404);
});

var server = app.listen(3000, () => {
    var port = server.address().port;
    console.log('Express server listening on port %s', port);
});