const path = require('path');
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');

const { host, port, user, pass } = require('../config/mailConfig.json')

const transport = nodemailer.createTransport({
    host,
    port,
    auth: {
      user, pass
    }
  });

  transport.use('compile', hbs ( {
    viewEngine: {
        extName: '.html',
        partialsDir: path.resolve(__dirname + '/resources/mail/layouts/'),
        layoutsDir: path.resolve(__dirname + '/resources/mail/layouts/'),
      },
      viewPath: path.resolve(__dirname + '/resources/mail/auth/'),
      extName: '.html',

  }))

  module.exports = transport;