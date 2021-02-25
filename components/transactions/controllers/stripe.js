//
// Stripe Payment Gateway Module
// Includes functions and tools for all users
//


// vars

var express = require('express'),
    routes = express.Router(),
    stripe = require('stripe')(config.stripe_secret_key),

    settings = {
        default_route: 'checkout',
        views: 'transactions/views'
    },


// functions


    functions = {

        currency:(input)=>{

            return '£'+(parseInt(input)/100).toFixed(2)

        },

        parseName:(input)=>{

            if (typeof input == 'object'){
                return input.first+' '+input.last
            } else {
                return 'No Name'
            }

        }

    }


// routes

    routes.post('/stripe/webhook', (req, res) => {

        let event = req.body
        var stripe_data;

        if (event && event.type){
            switch (event.type) {
                case 'payment_intent.succeeded':
                    stripe_data = event.data.object;

                    if (!stripe_data.customer){

                        let payload = {
                            payment_method: stripe_data.charges.data[0].payment_method,
                            name:stripe_data.charges.data[0].billing_details.name
                        }

                        if (stripe_data.charges.data[0].billing_details.email){
                            payload.email = stripe_data.charges.data[0].billing_details.email
                        }

                        if (stripe_data.charges.data[0].billing_details.phone){
                            payload.phone = stripe_data.charges.data[0].billing_details.phone
                        }

                        var create_customer = stripe.customers.create(payload);

                    }

                    break;
                case 'payment_method.payment_failed':
                    stripe_data = event.data.object;
                //    console.log(stripe_data)
                    break;
                    // ... handle other event types
                case 'payment_method.amount_capturable_updated':
                    stripe_data = event.data.object;
                //    console.log(stripe_data)
                    break;
                    // ... handle other event types
                case 'customer.created':
                    stripe_data = event.data.object;
                    //    console.log('customer',stripe_data)

                    if (stripe_data.email){
                    //    customer.addStripeID(stripe_data.email, stripe_data.id)
                    }

                    if (stripe_data.phone){
                    //    customer.addStripeID(stripe_data.phone, stripe_data.id)
                    }
                    break;
                    // ... handle other event types
                case 'customer.updated':
                    stripe_data = event.data.object;
                    break;
                    // ... handle other event types
                default:
                    // Unexpected event type
                return res.status(400).end();
            }

            // Return a response to acknowledge receipt of the event
            res.json({received: true});

        } else {
            return res.status(404).end();
        }

    })


    routes.get('/stripe/success', async (req, res) => {

        let data = {
            title:"Stripe Checkout",
            stripe_id: config.stripe_publishable_key
        }

        if (req.session && req.session.user && req.session.user.guard){
            data.user = req.session.user
        } else {
            data.user = {}
        }

        data.cart = await new Cart().init(req)

        if (req.session.cart_id && req.session.intent){ // if customer is paying for a cart

            stripe.paymentIntents.retrieve(req.session.intent,async (err, paymentIntent) => {

                if (err){

                    data.type = '400'
                    data.error = err
                    res.render(settings.views+'/checkout.ejs',data)

                } else if (paymentIntent.status == 'succeeded'){

                    req.session.intent = false
                    req.session.cart_id = false
                    data.cart.status = 'paid'
                    data.cart.status_logs = {
                        paid: moment().toISOString()
                    }
                    data.transaction = await new Transactions(data.cart).save()

                    if (data.transaction.data){
                        new global.Events('send_receipt').trigger(data.transaction.data)
                        res.render(settings.views+'/success.ejs',data)
                    } else {
                        data.type = '400'
                        data.error = 'There has been an issue processing your transaction'
                        res.render(settings.views+'/gateways/stripe.ejs',data)
                    }


                } else if (paymentIntent.status == 'canceled'){

                    data.type = '400'
                    data.error = 'Your transaction has been canceled'
                    res.render(settings.views+'/gateways/stripe.ejs',data)

                } else {

                    data.type = '402'
                    data.error = 'We are sorry, there was an issue processing your payment. Please try again using a different payment method'
                    res.render(settings.views+'/gateways/stripe.ejs',data)

                }

            })

        } else {

            data.type = '404'
            res.render(settings.views+'/gateways/stripe.ejs',data)

        }

    })


    routes.get('/stripe', async (req, res) => {

        res.locals.functions = functions

        let data = {
            title:"Stripe Checkout",
            include_scripts: [settings.views+'/scripts/script.ejs'],
            include_styles: [settings.views+'/styles/stripe.ejs']
        }

        data.cart = await new Cart().init(req)

        if (data.cart && data.cart.items && data.cart.items.length > 0 && parseInt(data.cart.total) > 0){

            const paymentIntent = await stripe.paymentIntents.create({
                amount: parseInt(data.cart.total),
                currency: 'gbp',
                payment_method_types: ['card'],
                setup_future_usage: 'off_session'
            })

            data.intent = paymentIntent
            data.stripe_id = global.view.transactions.stripe_public_key
            req.session.intent = paymentIntent.id

            res.render(settings.views+'/gateways/stripe.ejs', data)

        } else {

            data.stripe_id = ''
            data.intent = {}
            data.type = '400'
            data.error = 'Please add items before submitting payment'
            res.render(settings.views+'/gateways/stripe.ejs',data)

        }



    })



// export


    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
