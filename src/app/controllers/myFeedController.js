const express = require('express');
const myAuthMiddleware = require('../middlewares/authMiddleware');

//Load Schemas
const FeedModel = require('../models/feedModel');
const LogModel = require('../models/logModel');

const myrouter = express.Router();

//Important - Use this function to protect and authenticate this controller endpoints with generated user token
myrouter.use(myAuthMiddleware);

// Regular Expressions //
// Your validation regular expressions goes here

//Get Feed - Endpoint Example
myrouter.get('/', async (req, res) => {

    try {
        const myfeed = await FeedModel.find({});

        return res.send({ myfeed });

    } catch (err) {
        //Register your LOG error information here
        return res.status(400).send({ error: 'Get feed error: ' + err });
    }

});

//Get Feed by ID - Endpoint Example
myrouter.get('/:myFeedID', async (req, res) => {

    try {

        // BEGIN of Endpoint fields validation //

        // Enter your REGEX fields validation here

        // END of Endpoint fields validation //

        const myfeed = await FeedModel.findById(req.params.myFeedID);

        return res.send({ myfeed });

    } catch (err) {
        //Register your LOG error information bellow
        return res.status(400).send({ error: 'Get Feed by ID error: ' + err });
    }

});

//Register Feed - Endpoint Example
myrouter.post('/', async (req, res) => {
    //Enter your feed database model fields body bellow
    var { userID, feedSubject, feedMessage, feedURL } = req.body;

    try {

        // BEGIN of JSON fields validation //
        
        //Enter your REGEX fields validation here

        // END of JSON fields validation //

        const myfeed = await FeedModel.create({ userid: userID, feedsubject: feedSubject, feedmessage: feedMessage, feedurl: feedURL });

        return res.send({ myfeed });

    } catch (err) {
        //LOG error
        const erromsg = err;
        try {
            const mylog = await LogModel.create(
                {
                    "datelog": Date.now().toString(),
                    "logmessage": err,
                });
            return res.status(400).send({ error: 'Register feed error: ' + err });
        } catch (err) {
            return res.status(400).send({ error: 'Insert Log error: ' + err + ' error message:' + erromsg });
        }
    }
});

//Update Feed
myrouter.put('/', async (req, res) => {
    //Enter your feed database model fields body bellow
    var { _id, userID, feedSubject, feedMessage, feedURL } = req.body;

    try {
        // BEGIN of JSON fields validation //
 
        //Enter your REGEX fields validation here

        // END of JSON fields validation //

        const myfeed = await FeedModel.findOneAndUpdate({ _id }, { userid: userID, feedsubject: feedSubject, feedmessage: feedMessage, feedurl: feedURL }, { new: true });

        return res.send({ myfeed });

    } catch (err) {
        //Register your Log error here
        return res.status(400).send({ error: 'Update feed error: ' + err });
    }
});

module.exports = app => app.use('/myfeed', myrouter);