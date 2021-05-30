const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mymailer = require('../../modules/mailer');

//Load Hash Token
const myAuthConfig = require('../../config/authenticationConfig');

//Load Schemas
const UserModel = require('../models/userModel');
const LogModel = require('../models/logModel');

//Load ContactUs Mail
const { contactusmailaddress } = require('../../config/mailConfig.json')

const myrouter = express.Router();

//Load Twilio SMS
const { accountSid, authToken, fromsms } = require('../../config/sendSmsConfig.json')
const myclient = require('twilio')(accountSid, authToken);

//Generate Token
function generateUserToken(params = {}) {
    return jwt.sign(params, myAuthConfig.secret, {
        //1 day expiration
        expiresIn: 86400,
    })
}

//Function to generate One Time Password
function generateOTPassword() {

    var digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < 6; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
}

// Regular Expressions //
//Country code Regex
const regexcountrycode = /^(\+?\d{1,3}|\d{1,4})$/
//Mobile Regex
const regexmobile = /^\d+$/
//Email Regex
const regexemail = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

//Register User - Endpoint example
myrouter.post('/registeruser', async (req, res) => {
    var { username, useremail, usercountrycode, usermobile } = req.body;

    const mytoken = generateOTPassword();

    try {
        // BEGIN of Endpoint fields validation //
        if (usercountrycode === undefined || usercountrycode === null || usercountrycode === "") {
            return res.status(400).send({ error: 'Countrycode is required.' });
        } else {
            usercountrycode = usercountrycode.replace("+", "");

            if (!regexcountrycode.test(usercountrycode)) {
                return res.status(400).send({ error: 'Countrycode informed is not a valid countrycode.' });
            }
        }

        if (usermobile === undefined || usermobile === null || usermobile === "") {
            return res.status(400).send({ error: 'Mobile is required.' });
        } else {
            if (!regexmobile.test(usermobile)) {
                return res.status(400).send({ error: 'Mobile informed is not a valid mobile.' });
            }
        }

        if (useremail === undefined || useremail === null || useremail === "") {
            return res.status(400).send({ error: 'Email is required.' });
        } else {
            if (!regexemail.test(useremail)) {
                return res.status(400).send({ error: 'Email informed is not a valid email.' });
            }
        }

        if (username === undefined || username === null || username === "") {
            return res.status(400).send({ error: 'Name is required.' });
        } 

        if (await UserModel.findOne({ countrycode: { $eq: usercountrycode }, mobile: { $eq: usermobile } })) {
            return res.status(400).send({ error: 'User already exists.' });
        }
        // END of Endpoint fields validation //

        const myuser = await UserModel.create({ username: username, useremail: useremail, usercountrycode: usercountrycode, usermobile: usermobile, userregisterToken: mytoken });

        mymailer.sendMail({
            to: email,
            from: 'YOUR FROM EMAIL ADDRESS',
            subject: 'User verification',
            template: 'register',
            context: { mytoken },
        }, (err) => {
            if (err)
                return res.status(400).send({ error: 'Cannot send register email. ' + err });

            return res.send();
        });

        myuser.userpassword = undefined;
        myuser.userregisterToken = undefined;
        return res.send({ myuser, usertoken: generateUserToken({ id: myuser.id }) });

    } catch (err) {
        //LOG error
        const erromsg = err;
        try {
            const mylog = await LogModel.create(
                {
                    "datelog": Date.now().toString(),
                    "logmessage": err,
                });
            return res.status(400).send({ error: 'User Register error: ' + err });
        } catch (err) {
            return res.status(400).send({ error: 'Insert LOG error: ' + err + ' Error message:' + erromsg });
        }
    }
});

//Login - Endpoint example
myrouter.post('/login', async (req, res) => {
    var { usercountrycode, usermobile } = req.body;

    const mytoken = generateOTPassword();

    try {
        // BEGIN of Endpoint fields validation //
        if (usercountrycode === undefined || usercountrycode === null || usercountrycode === "") {
            return res.status(400).send({ error: 'Countrycode is required.' });
        } else {
            usercountrycode = usercountrycode.replace("+", "");

            if (!regexcountrycode.test(usercountrycode)) {
                return res.status(400).send({ error: 'Countrycode informed is not a valid countrycode.' });
            }
        }

        if (usermobile === undefined || usermobile === null || usermobile === "") {
            return res.status(400).send({ error: 'Mobile is required.' });
        } else {
            if (!regexmobile.test(mobile)) {
                return res.status(400).send({ error: 'Mobile informed is not a valid mobile.' });
            }
        }
        // END of Endpoint fields validation //

        const myuser = await UserModel.findOneAndUpdate({ usercountrycode, usermobile }, { "$set": { "userlastlogin": Date.now() } }, { new: true }).select('+userpassword').select('+userregisterToken');

        if (!myuser) {
            return res.status(400).send({ error: 'Invalid User. Countrycode: ' + usercountrycode + ' mobile: ' + usermobile });
        }


        if (myuser.userregisterToken) {
            return res.status(400).send({ error: 'Email not confirmed. Please confirm your email before login.' });
        }

        myuser.userpassword = mytoken;

        await myuser.save();

        //Send Email with Token
        mymailer.sendMail({
            to: myuser.useremail,
            from: 'YOUR FROM EMAIL',
            subject: 'YOUR COMPANY NAME - Login',
            template: 'login',
            context: { mytoken },
        }, (err) => {
            if (err)
                return res.status(400).send({ error: 'Cannot send login email. ' + err });

            return res.send();
        });

        //Send SMS message with Token
        myclient.messages.create({
            body: 'Welcome to YOUR COMPANY NAME, please see your verification code:' + mytoken,
            from: fromsms,
            to: '+' + usercountrycode + usermobile
        });
        // Show SMS message ID
        //.then(message => console.log(message.sid));

        res.json('User Token sent.');

    } catch (err) {
        //LOG error
        const erromsg = err;
        try {
            const mylog = await LogModel.create(
                {
                    "datelog": Date.now().toString(),
                    "logmessage": err,
                });
            return res.status(400).send({ error: 'User login error: ' + err });
        } catch (err) {
            return res.status(400).send({ error: 'Insert LOG error: ' + err + ' Error message:' + erromsg });
        }
    }

});

//Login OTP - Endpoint example
myrouter.post('/loginotp', async (req, res) => {
    var { usercountrycode, usermobile, userpassword } = req.body;

    try {
        // BEGIN of Endpoint fields validation //
        if (usercountrycode === undefined || usercountrycode === null || usercountrycode === "") {
            return res.status(400).send({ error: 'Countrycode is required.' });
        } else {
            usercountrycode = usercountrycode.replace("+", "");

            if (!regexcountrycode.test(usercountrycode)) {
                return res.status(400).send({ error: 'Countrycode informed is not a valid countrycode.' });
            }
        }

        if (usermobile === undefined || usermobile === null || usermobile === "") {
            return res.status(400).send({ error: 'Mobile is required.' });
        } else {
            if (!regexmobile.test(usermobile)) {
                return res.status(400).send({ error: 'Mobile informed is not a valid mobile.' });
            }
        }

        if (userpassword === undefined || userpassword === null || userpassword === "") {
            return res.status(400).send({ error: 'One-time-password is required.' });
        }
        // END of Endpoint fields validation //

        const myuser = await UserModel.findOneAndUpdate({ usercountrycode, usermobile }, { "$set": { "userlastlogin": Date.now() } }, { new: true }).select('+userpassword').select('+userregisterToken');

        if (!myuser) {
            return res.status(400).send({ error: 'Invalid User.' });
        }

        if (!await bcrypt.compare(userpassword, myuser.userpassword)) {
            return res.status(400).send({ error: 'Invalid Password.' });
        }

        if (myuser.userregisterToken) {
            return res.status(400).send({ error: 'Email not confirmed. Please confirm your email before login.' });
       }

        myuser.userpassword = undefined;
        myuser.userregisterToken = undefined;

        res.send({ myuser, usertoken: generateUserToken({ id: myuser.id }) });

    } catch (err) {
        //Enter your LOG error registration here
    }

});

//Confirm user email - Endpoint example
myrouter.post('/confirmuseremail', async (req, res) => {
    const { useremail, usertoken } = req.body;

    // BEGIN of Endpoint fields validation //
    if (useremail === undefined || useremail === null || useremail === "") {
        return res.status(400).send({ error: 'Email is required.' });
    } else {
        if (!regexemail.test(useremail)) {
            return res.status(400).send({ error: 'Email informed is not a valid email.' });
        }
    }

    if (usertoken === undefined || usertoken === null || usertoken === "") {
        return res.status(400).send({ error: 'Token is required.' });
    }
    // END of Endpoint fields validation //

    try {

        const myuser = await UserModel.findOne({ useremail })
            .select('+userregisterToken')

        if (!myuser)
            return res.status(400).send({ error: 'User not found.' });

        if (myuser.userregisterToken === "" || !myuser.userregisterToken)
            return res.status(400).send({ error: 'Email already confirmed' });

        if (usertoken !== myuser.userregisterToken) {
            return res.status(400).send({ error: 'Inavlid Token' });
        }

        myuser.userregisterToken = undefined;

        await myuser.save();

        mymailer.sendMail({
            to: useremail,
            from: 'YOUR FROM EMAIL',
            subject: 'YOUR COMPANY - Welcome',
            template: 'welcome',
            context: { usertoken },
        }, (err) => {
            if (err)
                return res.status(400).send({ error: 'Cannot send welcome email. ' + err });

            return res.send();
        });

        res.json('User Email Confirmed.');

    } catch (err) {
        res.sendStatus(400).send({ error: 'Error confirming email. ' + err });
        //Enter your Error LOG registration here
    }

})

//Contact Us Message - Endpoint example
myrouter.post('/contactusmessage', async (req, res) => {
    const { username, usercontactnumber, useremail, usermessage } = req.body;

    // BEGIN of Endpoint fields validation //
    if (username === undefined || username === null || username === "") {
        return res.status(400).send({ error: 'Name is required.' });
    }

    if (usercontactnumber === undefined || usercontactnumber === null || usercontactnumber === "") {
        return res.status(400).send({ error: 'Contact Number is required.' });
    } else {
        if (!regexmobile.test(usercontactnumber)) {
            return res.status(400).send({ error: 'Contact number informed is not a valid number.' });
        }
    }

    if (useremail === undefined || useremail === null || useremail === "") {
        return res.status(400).send({ error: 'Email is required.' });
    } else {
        if (!regexemail.test(useremail)) {
            return res.status(400).send({ error: 'Email informed is not a valid email.' });
        }
    }

    if (usermessage === undefined || usermessage === null || usermessage === "") {
        return res.status(400).send({ error: 'Message is required.' });
    }
    // END of Endpoint fields validation //

    mymailer.sendMail({
        to: contactusmailaddress,
        from: useremail,
        subject: 'YOUR COMPANY NAME - Contact Us',
        template: 'contactus',
        context: { username, useremail, usercontactnumber, usermessage },
    }, (err) => {
        if (err) {
            return res.status(400).send({ error: 'Cannot send Contact Us email. ' + err });
            //Enter your Error LOG registration here
        } else {
            res.json('Thank you for contacting us. We appreciate your message.');
        }
    });

})

module.exports = app => app.use('/user', myrouter);