//Remember to add this file to .gitignore file
// path: src/database/

const db = require('mongoose');

try{
    //Change the parameters bellow to your MONGODB environment information
    //db.connect('mongodb+srv://MONGODBUSERNAME:MONGODBUSERPASSWORD@YOUR MONGODB CONNECTION URL GOES HERE/YOUR MONGODB COLLECTION GOES HERE', { useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true  });
    db.Promise = global.Promise;
    db.set('useCreateIndex', true);
} catch(err) {
    console.log(err);
}


module.exports = db;