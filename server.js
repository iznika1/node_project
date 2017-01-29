var express = require('express')
var bodyParser = require('body-parser')
var morgan = require('morgan')

var translator = require('./translator')
var config = require('./config')

var app = express()
app.use(morgan('dev'))

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

var port = process.env.PORT || 8080

translator.init()

app.get('/', (req, res) => {
    res.json({ message: 'AΩ' })
});

app.get('/words/:lang', (req, res) => {

    try {

        if(!req.get('Authorization')) res.status(403).send('');
        translator.auth(req.get('Authorization'), (err) => {
            if (err == null) {

                let lang = req.params.lang

                if (!config.langs.includes(lang)) {

                    res.status(500).send('')

                } else {

                    translator.getDictionary(lang, (err, result) => {
                        if (err == null) {
                            res.json(result)
                        } else {
                            throw err
                        }
                    })

                }
            } else {
                res.status(403).send('');
            }
        })
    } catch (ex) {

        console.log(ex);
        res.status(500).send('')

    }

})

app.get('/users/', (req, res) => {

    try {
        translator.users((err, result) => {
            if (err == null) {
                res.json(result)
            } else {
                throw err
            }
        })

    } catch (ex) {

        console.log(ex);
        res.status(500).send('')

    }

})

app.post('/login', (req, res) => {
    try {

        let username = req.body.username
        let password = req.body.password

        if (username === undefined || password === undefined) {
            res.status(500).send('')
        } else {
            translator.login(username, password, (err, result) => {
                if (err == null) {
                    res.json(result)
                } else {
                    throw err
                }
            });
        }

    } catch (ex) {
        console.log(ex);
        res.status(500).send('')
    }
});

app.post('/register', (req, res) => {
    try {

        let username = req.body.username
        let password = req.body.password
		
		console.log(username);
		console.log(password);
		

        if (username === undefined || password === undefined) {
            res.status(500).send('')
        } else {
            translator.register(username, password, (err) => {
                if (err == null) {
                    res.status(201).send('')
                } else {
                    throw err
                }
            });
        }

    } catch (ex) {
        console.log(ex);
        res.status(500).send('')
    }
});

app.get('/translate/:langFrom/to/:langTo', (req, res) => {

    try {

        let langFrom = req.params.langFrom
        let langTo = req.params.langTo
        let word = req.query.word
        let id = req.query.id


        if(!req.get('Authorization')) res.status(403).send('');
        translator.auth(req.get('Authorization'), (err) => {
            if (err == null) {

                if (!config.langs.includes(langFrom) || !config.langs.includes(langTo) || langFrom === undefined || langTo === undefined || (word === undefined && id === undefined)) {

                    res.status(500).send('')

                } else {

                    if (id == undefined) {

                        translator.translate(word, langFrom, langTo, (err, result) => {
                            if (err == null) {
                                res.json(result)
                            } else {
                                throw err
                            }
                        })

                    } else {

                        translator.translateById(id, langFrom, langTo, (err, result) => {
                            if (err == null) {
                                res.json(result)
                            } else {
                                throw err
                            }
                        })

                    }

                }
            } else {
                res.status(403).send('');
            }
        });


    } catch (ex) {

        console.log(ex);
        res.status(500).send('')

    }

})

app.post('/translate', (req, res) => {

    try {

        let langFrom = req.body.langFrom
        let langTo = req.body.langTo
        let word = req.body.word
        let translation = req.body.translation

        if(!req.get('Authorization')) res.status(403).send('');
        translator.auth(req.get('Authorization'), (err) => {
            if (err == null) {

                if (!config.langs.includes(langFrom) || !config.langs.includes(langTo) || langFrom === undefined || langTo === undefined || word === undefined || translation === undefined) {

                    res.status(500).send('')

                } else {
                    translator.addTranslation(word, translation, langFrom, langTo, (err, result) => {
                        if (err == null) {
                            if (result.added) {
                                res.status(201).send('')
                            } else {
                                res.status(409).send('')
                            }
                        } else {
                            throw err
                        }
                    });
                }
            } else {
                res.status(403).send('');
            }
        })
    } catch (ex) {

        console.log(ex)
        res.status(500).send('')

    }
})

app.delete('/translate', (req, res) => {

    try {

        let langFrom = req.body.langFrom
        let langTo = req.body.langTo
        let wordId = req.body.wordId
        let translationId = req.body.translationId
        let removeTranslation = req.body.removeTranslation

        if(!req.get('Authorization')) res.status(403).send('');

        translator.auth(req.get('Authorization'), (err) => {
            if (err == null) {

                if (!config.langs.includes(langFrom) || !config.langs.includes(langTo) || langFrom === undefined || langTo === undefined || wordId === undefined || translationId === undefined) {

                    res.status(500).send('')

                } else {
                    translator.removeTranslationById(wordId, translationId, removeTranslation, langFrom, langTo, (err, result) => {
                        if (err == null) {
                            res.status(200).send('')
                        } else {
                            throw err
                        }
                    });
                }
            } else {
                res.status(403).send('');
            }
        })
    } catch (ex) {

        console.log(ex)
        res.status(500).send('')

    }
});

app.listen(port);

console.log('Magic happens on port ' + port);