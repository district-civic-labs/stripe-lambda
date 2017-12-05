require('dotenv').load();

const AWS = require('aws-sdk');
let encrypted;
let decrypted;

function processEvent(event, context, callback) {
    const stripe = require('stripe')(decrypted);
    body = event;

    stripe.charges.create({
        amount:        body.amount,
        source:        body.token,
        currency:      body.currency || 'usd',
        description:   'Donation from '+body.email+': '+body.instruction || 'Donation from '+body.email,
        receipt_email: body.email,
    }, function(err, charge) {
        var message;
        var chargeSuccess;
        if (err && err.type == 'card_error') {
            message = 'Something went wrong with that card. Please check the information you entered.';
            chargeSuccess = false;
        } else if (err) {
            message = 'Something went wrong. Maybe try again later';
            chargeSuccess = false;
        } else {
            message = 'Donation successful! Check your email shortly for a receipt.';
            chargeSuccess = true;
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
        }

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
