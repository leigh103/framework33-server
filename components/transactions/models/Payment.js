
const Stripe = require('stripe')(config.stripe_secret_key)

class Payment {

    contructor(data){

        this.transaction = data

    }

    stripe(){

        return new Promise( async (resolve, reject) => {



        })

    }

}

module.exports = Payment
