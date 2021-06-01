//
// PayPal Payment Gateway Module
// Includes functions and tools for all users
//


// vars

var express = require('express'),
    routes = express.Router(),
    axios = require('axios'),

    settings = {
        default_route: 'checkout/paypal',
        views: 'transactions/views'
    },

    access_token = '',


// functions


    functions = {

        getAuthToken: () => {

            return new Promise( async (resolve, reject) => {

                let result = await axios({
                    url: config.paypal.url+'/v1/oauth2/token',
                    method: 'post',
                    headers: {
                    Accept: 'application/json',
                        'Accept-Language': 'en_US',
                        'content-type': 'application/x-www-form-urlencoded',
                    },
                    auth: {
                        username: config.paypal.client,
                        password: config.paypal.secret,
                    },
                    params: {
                        grant_type: 'client_credentials',
                    },
                })

                access_token = result.data
                access_token._created = moment()
                resolve(access_token)

            })

        },

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

    routes.get('*', async (req, res, next) => {

        if (!access_token || moment().diff(access_token._created, 'seconds') >= access_token.expires_in){
            await functions.getAuthToken()
            next()
        } else {
            next()
        }

    })

    routes.post('*', async (req, res, next) => {

        if (!access_token || moment().diff(access_token._created, 'seconds') >= access_token.expires_in){
            await functions.getAuthToken()
            next()
        } else {
            next()
        }

    })

    routes.post('/create', (req, res) => {

        console.log('here')

        var payload = {
                auth: {
                        user: config.paypal.client,
                        pass: config.paypal.secret
                    },
                body:{
                    intent: 'sale',
                    payer:{
                        payment_method: 'paypal'
                    },
                    transactions: [
                        {
                            amount:{
                                total: '5.99',
                                currency: 'USD'
                            }
                        }
                    ],
                    redirect_urls: {
                        return_url: config.site.url+'/checkout/paypal/success',
                        cancel_url: config.site.url+'/checkout/paypal/cancel'
                    }
                },
                json: true
            }

        axios.post(config.paypal.url + '/v1/payments/payment', payload)
        .then(function (response) {
            console.log(response)
            res.json({id: response.body.id})
        })
        .catch(function (error) {
            console.log(error)
        })

    })

    routes.post('/execute', async (req, res) => {

        // 2. Get the payment ID and the payer ID from the request body.
    var paymentID = req.body.paymentID,
        payerID = req.body.payerID,
        payload = {
            auth: {
                user: config.paypal.client,
                pass: config.paypal.secret
            },
            body: {
                payer_id: payerID,
                transactions: [
                    {
                        amount: {
                            total: '10.99',
                            currency: 'USD'
                        }
                    }
                ]
            },
            json: true
        }

        // 3. Call /v1/payments/payment/PAY-XXX/execute to finalize the payment.
        axios.post(config.paypal.url + '/v1/payments/payment/' + paymentID + '/execute', payload)
        .then(function (response) {
            console.log(response)
            res.json({status: 'success'})
        })
        .catch(function (error) {
            console.log(error)
        })

    })

    routes.post('/capture', async (req, res) => {

        axios.post(config.paypal.url + '/v2/checkout/orders/'+req.body.orderID, { headers: { Authorization: `Bearer ${data.token}` } })

    })


    routes.get('/success', async (req, res) => {

        res.send('Great success')

    })

    routes.get('/cancel', async (req, res) => {

        res.send('Paypal cancelled')

    })

    routes.get('/:id', async (req, res) => {

        let data = {
            title:"Paypal Checkout"
        }

        axios.get(config.paypal.url + '/v2/checkout/orders/'+req.params.id, {"headers":{"Authorization":"Bearer "+access_token.access_token,"Content-Type":"application/json"}})
        .then( async (response) => {

            data.cart = await new Cart().init(req)

            if (response && response.data && response.data.status && response.data.status == 'COMPLETED' && data.cart.items.length > 0){

                if (data.cart.items.length <= 0){
                    data.type = '400'
                    data.error = 'There has been an issue processing your transaction'
                    res.render(config.site.theme_path+'/templates/transactions/gateways/paypal.ejs',data)
                    return false
                }

                data.cart.status = 'new'
                data.cart.status_logs = {
                    paid: moment().toISOString()
                }

                data.cart.payment_method = 'paypal'
                data.cart.payment_id = response.data.id
                data.cart.payment_data = response.data

                data.transaction = await new Transactions(data.cart).save()

                if (data.transaction.data){
                    new Automations('order_receipt').trigger(data.transaction.data)
                    res.render(config.site.theme_path+'/templates/transactions/success.ejs',data)
                } else {

                    data.cart.error = 'Transaction not saved after payment'
                    new Automations('transaction_issue').trigger(data.cart)
                    data.type = '400'
                    data.error = 'There has been an issue processing your transaction'
                    res.render(config.site.theme_path+'/templates/transactions/gateways/paypal.ejs',data)
                }

            } else {
                data.type = '400'
                data.error = 'This transaction has already been processed'
                res.render(config.site.theme_path+'/templates/transactions/gateways/paypal.ejs',data)
                return false
            }

        })
        .catch( async (error) => {

            data.cart = await new Cart().init(req)
            data.cart.error = error.message

            new Automations('transaction_issue').trigger(data.cart)
            data.type = '500'
            data.error = error.message
            res.render(config.site.theme_path+'/templates/transactions/gateways/paypal.ejs',data)
            return false

        })


    })
// export


    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
