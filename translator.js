var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('translate.db');
var async = require('async');

function removeWordById(wordId, lang, callback) {
    
    db.get(`DELETE FROM ${lang} WHERE id == ${wordId}`, (err) => {
        callback(err)
    })

}

function addWord(word, lang, callback) {

    db.get(`SELECT * FROM ${lang} WHERE word == '${word}'`
        , (err, result) => {
            if (err == null) {

                if (result == undefined) {
                    db.run(`INSERT INTO ${lang} (word)
                         VALUES ('${word}')`
                        , function (err) {
                            if (err == null) {
                                callback(null, { id: this.lastID, lang: lang })
                            } else {
                                callback(err)
                            }
                        });

                } else {
                    callback(null, { id: result.id, lang: lang })
                }
            } else {
                callback(err)
            }
        })

}

module.exports = {
    init: () => {
        db.serialize(() => {
            db.run("CREATE TABLE if not exists croatian (id INTEGER PRIMARY KEY AUTOINCREMENT, word TEXT)")
            db.run("CREATE TABLE if not exists slovenian (id INTEGER PRIMARY KEY AUTOINCREMENT, word TEXT)")
            db.run("CREATE TABLE if not exists translation (slovenianid INTEGER, croatianid INTEGER, PRIMARY KEY (slovenianid, croatianid))")
            db.run("CREATE TABLE if not exists users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, hashedPassword TEXT, salt TEXT)")
        });
    },
    getDictionary: (lang, callback) =>{
        
        var result = { words : []}

        db.each(`SELECT * FROM ${lang}`,  (err, row) => {
            result.words.push(row)
        }, (err) => {
            if(err == null) {
                callback(null, result)
            } else {
                callback(err)
            }
        })
    },
    translateById: (id, langFrom, langTo, callback) =>{
        var result = { langFrom: "", langTo: [] };

        db.each(`SELECT ${langFrom}.word as wordFrom, ${langTo}.word FROM ${langFrom} 
                JOIN translation ON ${langFrom}.id == translation.${langFrom}id 
                JOIN ${langTo} ON ${langTo}.id == translation.${langTo}id 
                WHERE ${langFrom}.id == '${id}'`
            , (err, row) => {
                if (err == null) {
                    if(result.langFrom == "") result.langFrom = row.wordFrom
                    result.langTo.push(row.word)
                } else {
                    callback(err)
                }
            }, (err) => {
                if (err == null) {
                    callback(null, result)
                } else {
                    callback(err)
                }
            })
    },
    translate: (word, langFrom, langTo, callback) => {
        result =  { langFrom: word, langTo: [] };

        db.each(`SELECT ${langTo}.word FROM ${langFrom} 
                JOIN translation ON ${langFrom}.id == translation.${langFrom}id 
                JOIN ${langTo} ON ${langTo}.id == translation.${langTo}id 
                WHERE ${langFrom}.word == '${word}'`
            , (err, row) => {
                if (err == null) {
                    result.langTo.push(row.word)
                } else {
                    callback(err)
                }
            }, (err) => {
                if (err == null) {
                    callback(null, result)
                } else {
                    callback(err)
                }
            });
    },
    addTranslation: (word, translation, langFrom, langTo, callback) => {
        async.parallel([
            (sync) => {
                addWord(word, langFrom, sync)
            },
            (sync) => {
                addWord(translation, langTo, sync)
            }
        ], function (err, results) {

            db.get(`SELECT * FROM translation 
                    WHERE ${results[0].lang}id == '${results[0].id}' 
                    AND ${results[1].lang}id == '${results[1].id}'`
                , (err, result) => {
                    if (err == null) {
                        if (result == undefined) {
                            db.get(`INSERT INTO translation (${results[0].lang}id, ${results[1].lang}id) 
                                    VALUES ('${results[0].id}', ${results[1].id})`
                                , (err, result) => {
                                    if (err == null) {
                                        callback(null, { added: true })
                                    } else {
                                        callback(err)
                                    }
                                });
                        } else {
                            callback(null, { added: false })
                        }
                    } else {
                        callback(err)
                    }
                });
        });

    },
    removeTranslationById: (wordId, translationId, removeTranslation, langFrom, langTo, callback) =>{
        db.run(`DELETE FROM translation WHERE ${langFrom}id == ${wordId} AND ${langTo}id == ${translationId}`, (err) => {
            if(err == null) {
                if(removeTranslation){
                    async.waterfall([
                        (sync) => { 
                            removeWordById(wordId, langFrom, sync)
                        },
                        (sync1) => { 
                            removeWordById(translationId, langTo, sync1)
                        }
                    ], (err) => {
                        callback(err)
                    });
                } else {
                    callback(null)
                }
            } else {
                callback(err)
            }
        });
    }
}