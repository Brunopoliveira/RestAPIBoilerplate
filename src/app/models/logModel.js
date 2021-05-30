const db = require('../../database');

//Log database schema model example - Change the name of your log schema bellow

const YourLogSchema = new db.Schema({
    datelog: {
        type: Date,
        required: true,
        default: Date.now,
    },
    logmessage: {
        type: String,
        required: true,
    },    
})

const LogModel = db.model('YourLogModel', YourLogSchema, 'yourlogcollection');

module.exports = LogModel;