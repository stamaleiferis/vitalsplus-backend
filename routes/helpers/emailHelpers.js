const sg = require('@sendgrid/mail');
require('dotenv').config();

sg.setApiKey(process.env.SENDGRID_KEY);

const sendEmail = (emails,from,subject,body,html) => {
  console.log(emails)
  const msg = {
  to: emails,
  from: from,
  subject: subject,
  text: body,
  html: html,
  };
  sg.send(msg,true);

}

exports.sendEmail = sendEmail
