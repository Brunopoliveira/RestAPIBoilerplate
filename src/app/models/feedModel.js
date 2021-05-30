const db = require('../../database');

//Feed database schema model example - Change the name of your feed schema bellow

const YourFeedSchema = new db.Schema({
    // Enter your Feed collection fields bellow
    userID: {
        type: db.Schema.Types.ObjectId,
        ref: 'YourUserModel',
    },
    feedSubject: {
        type: String, 
    },
    feedMessage: {
        type: String,
    },
    feedURL: {
        type: String,
    }
})


const FeedModel = db.model('YourFeedModel', YourFeedSchema, 'yourfeedcollection');

module.exports = FeedModel;