const db = require('../../database');
const bcrypt = require('bcryptjs');

//User database schema model example - Change the name of your user schema bellow

const YourUserSchema = new db.Schema({
    username: {
        type: String,
        required: true, 
    },
    useremail: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
    },
    usercountrycode: {
        type: String,
        required: true,
    },
    usermobile: {
        type: String,
        required: true,
    },
    userpassword: {
        type: String,
        select: false,
    },
    useractive: {
        type: Boolean,
        dafault: true,
    },
    userregisterToken: {
        type: String,
        select: false,
    },
    usercreated: {
        type: Date,
        required: true,
        default: Date.now,
    },
    userlastlogin: {
        type: Date,
    }
})

// Hashing the password
YourUserSchema.pre('save' , async function(next) {
    if (this.userpassword) {
        const hash = await bcrypt.hash(this.userpassword, 10);
        this.userpassword = hash;
    }
    next();
});

//Change the parameters bellow with your Schema, Model and collection descriptions
const UserModel = db.model('YourUserModel', YourUserSchema, 'yourusercollection');

module.exports = UserModel;
