# stripe-lambda

A little thing for processing Stripe transactions on AWS Lambda.

While Stripe will validate transactions with a public API key, meaning that most of it can happen on a static site, the transaction must be completed using a secret API key. This accepts the form data from our site and completes the transaction.

## Developing

```
npm install

export STRIPE_SECRET_KEY=your_secret_key
```

## Deployment

1. Create a new AWS Lambda function

1. Make sure that you have your Stripe account set up

1. Copy your Stripe secret key to the function's environment as `STRIPE_SECRET_KEY`

1. Copy your Stripe test secret key to the function's environment as `TEST_SECRET_KEY`

1. Put the code into the function

1. Something with API Gateway? Make a note of the URL you receive for later

## Integration on another site

You can start with the [template form](./template-form.html) in this repo. You can see this form in action over on districtciviclabs.org.

1. Swap out `PUBLIC_TEST_KEY` and `PUBLIC_LIVE_KEY` with their respective public keys

1. Swap out `API_GATEWAY_URL` with your API Gateway URL from above.

1. Edit the name and description in the handler, if appropriate.

## License

Copyright is waived under a [CC0-1.0 waiver](LICENSE.md).
