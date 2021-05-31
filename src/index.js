const express = require('express');
const bodyParser = require('body-parser');

var cors = require('cors')

const app = express();

app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

//Load all controllers files
require('./app/controllers/index')(app);

app.get('/', function (req, res) {

    res.send('REST API BOILERPLATE v0.0.2')
  
  })

app.listen(3000);

console.log('Listening on port 3000');
