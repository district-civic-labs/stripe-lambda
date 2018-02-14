'use strict';
require('dotenv').load();
try {
  var emailBody = require('./emailBody');
} catch (e) {
  console.log('no email text module');
}

const AWS = require('aws-sdk');
const nodemailer = require('nodemailer');
let encrypted;
let decrypted;

function sendReceipt(toEmail, amount) {
  let transporter = nodemailer.createTransport({
    host: process.env.EMAIL_URL,
    port: 587,
    secure: false, // upgrade later with STARTTLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    debug: true
  });

  let text = emailBody.getText(amount);
  let html = emailBody.getHtml(amount);

  let message = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: 'Thank you for your donation!',
    text: text,
    html: html
  };

  transporter.sendMail(message);
}

function processEvent(event, context, callback) {
    const stripe = require('stripe')(decrypted);
    var body = event;

    stripe.charges.create({
        amount:        body.amount,
        source:        body.token,
        currency:      body.currency || 'usd',
        description:   'Donation from '+body.email+': '+body.instruction || 'Donation from '+body.email,
        receipt_email: body.email,
    }, function(err, charge) {
        var message;
        var chargeSuccess;
        if (err && err.type === 'card_error') {
            message = 'Something went wrong with that card. Please check the information you entered.';
            chargeSuccess = false;
        } else if (err) {
            message = 'Sorry, something went wrong. Maybe try again later';
            chargeSuccess = false;
        } else {
            message = 'Donation successful! Check your email shortly for a receipt.';
            chargeSuccess = true;
            if (typeof emailBody !== 'undefined') {
              sendReceipt(body.email, body.amount);
            }
        }
        let response = {
            statusCode: 200,
            body: JSON.stringify({
                message: message,
                chargeSuccess: chargeSuccess
            }),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST,OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
            }
        };

        console.log(response);
        callback(null, response);
    });
}

exports.handler = (event, context, callback) => {
    event = JSON.parse(event.body);
    const account = event.account;

    // This allows differentiating between live and test forms, to help make
    // dev a little bit easier
    if (account === "live") {
        encrypted = process.env.STRIPE_SECRET_KEY;
    } else {
        encrypted = process.env.TEST_SECRET_KEY;
    }

    if (decrypted) {
        processEvent(event, context, callback);
    } else {
        // Decrypt code should run once and variables stored outside of the function
        // handler so that these are decrypted once per container
        const kms = new AWS.KMS();
        kms.decrypt({ CiphertextBlob: new Buffer(encrypted, 'base64') }, (err, data) => {
            if (err) {
                console.log('Decrypt error:', err);
                return callback(err);
            }
            decrypted = data.Plaintext.toString('ascii');
            processEvent(event, context, callback);
        });
    }
};
