
    const Models = require(basedir+'/modules/Models')

    class Transactions extends Models {

        constructor(data){

            super(data)

            this.statuses = [
                {text:'New',value:'new',icon:'cart-plus'},
                // {text:'Paid',value:'paid',icon:'clipboard-check'},
                {text:'Processing',value:'processing',icon:'box-open'},
                {text:'Shipped',value:'shipped',icon:'mail-bulk'},
                {text:'Completed',value:'completed',icon:'check-circle'},
                {text:'Refund',value:'refund',icon:'mail-bulk'},
                {text:'Deleted',value:'deleted',icon:'trash-alt'}
            ]

            this.settings = {
                collection: 'transactions',
                fields: [
                    // {name:'status',input_field:'select',options:this.statuses, type:'string', required:false},
                    // {name:'barcode',input_field:'_key',placeholder:'Barcode', type:'barcode', required:false},
                    {name:'reference', type:'string', input_type:'text',required:true},
                    {name:'items', type:'array', tab:'items',required:false},
                    {name:'customer', type:'object', required:false, tab:'customer',subitems:[
                        {name:'title',input_type:'select',options:[{text:'Mr',value:'mr'},{text:'Mrs',value:'mrs'},{text:'Miss',value:'miss'},{text:'Ms',value:'ms'},{text:'Dr',value:'dr'}],placeholder:'Title', type:'string', required:false},
                        {name:'full_name',input_type:'text',placeholder:'Name', type:'string', required:true},
                        {name:'email',input_type:'email',placeholder:'Email Address', type:'email', required:false},
                        {name:'tel',input_type:'number',placeholder:'Mobile Number', type:'tel', required:false},
                        {name:'notification_method',input_type:'select',options:[{text:'SMS Text',value:'sms'},{text:'Email',value:'email'}],placeholder:'Select preferred notification method', type:'string', required:false}
                    ]},
                    {name:'billing_address', type:'object', required:false, tab:'customer',subitems:[
                        {name:'address_line1',input_type:'text',placeholder:'Address Line 1', type:'string', required:true},
                        {name:'address_line2',input_type:'text',placeholder:'Address Line 2', type:'string', required:false},
                        {name:'address_level1',input_type:'text',placeholder:'County', type:'string', required:false},
                        {name:'address_level2',input_type:'text',placeholder:'City', type:'string', required:true},
                        {name:'postal_code',input_type:'text',placeholder:'Post Code', type:'string', required:true}
                    ]},
                    {name:'shipping_address', type:'object', required:false, tab:'customer',subitems:[
                        {name:'address_line1',input_type:'text',placeholder:'Address Line 1', type:'string', required:true},
                        {name:'address_line2',input_type:'text',placeholder:'Address Line 2', type:'string', required:false},
                        {name:'address_level1',input_type:'text',placeholder:'County', type:'string', required:false},
                        {name:'address_level2',input_type:'text',placeholder:'City', type:'string', required:true},
                        {name:'postal_code',input_type:'text',placeholder:'Post Code', type:'postcode', required:true}
                    ]},
                    {name:'status', input_type: 'select', options:this.statuses, type:'string', required:true},
                    {name:'_user_id', type:'string', required:true}
                ],
                search_fields:['customer.name','reference','customer.email','customer.tel','billing_address.postal_code','shipping_address.postal_code']
            }

            this.routes = {
                public: { // unauth'd routes
                    get: {

                    },
                },
                private: { // auth'd routes
                    get: {
                        all:['admin','self'],
                        search:['admin'],
                        find:['admin','self'],
                        totalSales:['admin']
                    },
                    post: {
                        save:['admin'],
                        updateStatus:['admin'],
                        refund:['admin']
                    },
                    put: {
                        save:['admin']
                    },
                    delete: {
                        delete:['admin']
                    }
                }
            }

        }

        async preSave(){

            return new Promise( async (resolve, reject) => {

                if (this.data._id && this.data._id.match(/^cart/)){ // if saving cart data, ie a new transaction

                    let transaction_data = this.data
                    this.settings.collection = 'cart'
                    await this.delete()
                    this.settings.collection = 'transactions'

                    this.data = transaction_data

                    await this.updateStock()

                    // await new Cart().find(this.data._key).delete()

                    delete this.data._id
                    delete this.data._key
                    delete this.data._created
                    delete this.data.guard

                    resolve()

                } else {

                    resolve()

                }

            })



        }

        async postSave(status){

            let save = false

            if (typeof this.data.customer == 'object' && this.data.customer.email && !this.data.customer._key && this.data.status == 'new'){

                this.data.customer.billing_address = this.data.billing_address
                this.data.customer.shipping_address = this.data.shipping_address

                if (this.data.tel){
                    this.data.customer.tel = this.data.tel
                }

                if (this.data.email){
                    this.data.customer.email = this.data.email
                }

                let user = await new Customers(this.data.customer).findOrSave()
                this.data.customer._key = user.data._key

                save = true

            }

            if (!this.data.status && !status){
                this.data.status = this.statuses[0].value
                save = true
            }

            if (this.data.reference && !this.data.barcode){

                let barcode_data = {
                    code: config.site.url+'/dashboard/transactions/edit/'+this.data._key,
                    type: 'qrcode',
                    name: this.data.reference
                }
                this.data.barcode = await new Barcode(barcode_data).save()
                save = true

            }

            if (save === true){
                this.save()
            }

        }

        async updateStock(){

            for (let item of this.data.items){

                let model

                if (typeof global[item.type] == 'function'){
                    model = new global[item.type]()
                    if (typeof model.updateStock == 'function'){
                        await model.updateStock(item._key, item.quantity)
                    }
                }


            }
            return this

        }

        async updateStatus(new_status, ids){

            if (typeof ids == 'string' && ids.match(/,/)){
                ids = ids.split(',')
            } else if (typeof ids == 'string'){
                let ids_array = []
                ids_array.push(ids)
                ids = ids_array
            }

            for (let id of ids){

                let payload = {status:new_status}
                let transaction = await DB.read(this.settings.collection).where(['_key == '+id]).update(payload).first() // update the transaction with the status

                if (typeof transaction == 'object' && transaction.status_logs && transaction.status_logs[new_status]){ // if the status has already been appiied
                    continue
                } else if (typeof transaction == 'object') { // if this is the first time the status is being applied, update the timestamp and trigger the notification

                    if (!payload.status_logs){
                        payload.status_logs = {}
                    }

                    payload.status_logs[new_status] = moment().toISOString()

                    try {
                        await DB.read(this.settings.collection).where(['_key == '+id]).update(payload).first()
                    }
                    catch(err){
                        log(err)
                    }

                    try {
                        await new Automations('order_'+new_status).trigger(transaction)
                    }
                    catch(err){
                        log(err)
                    }

                }

            }

            return ids

        }

        async refund(data){

            let new_refund_cart = await new Cart().getTemplate()

            new_refund_cart.data.customer = this.data.customer
            new_refund_cart.data._key = Date.now()
            new_refund_cart.data._id = 'cart/'+new_refund_cart.data._key
            new_refund_cart.data._user_id = this.data.customer._key
            new_refund_cart.data.items = data.items
            new_refund_cart.data.status = 'refund'
            new_refund_cart.data.transaction_id = this.data._key
            new_refund_cart.data.reference = 'R'+this.data.reference

            await new_refund_cart.refundItems()
            await new_refund_cart.calcRefundTotal()
            // console.log(new_refund_cart.data)
            let new_refund = await new Transactions(new_refund_cart.data).save()
            await this.updateRefundItems(data, new_refund.data._key)
            this.data.status_logs['refunded'] = moment().toISOString()
            this.data.refund_reference = new_refund.data.reference
            this.data.refund_total = new_refund.data.total
// console.log('items',this)
            this.save()
            return this

        }

        async updateRefundItems(data, refund_id){

            return new Promise( async (resolve, reject) => {

                data.items.map((refund_item)=>{
                    for (let i in this.data.items){
                        if (refund_item._key == this.data.items[i]._key && refund_item.type == this.data.items[i].type){
                            this.data.items[i].refund_transaction_id = refund_id
                            this.data.items[i].refund_value = refund_item.refund_value
                            this.data.items[i].refund_date = refund_item.refund_date
                            this.data.items[i].refund_qty = refund_item.refund_qty
                        }
                    }
                })

                resolve()

            })

        }

        registerAutomations(){

            let order_processing = {
              "name": "Order Processing",
              "trigger": "order_processing",
              "description": "Notification when a paid order has been printed and marked as 'processing'",
              "actions": [
                {
                  "method": "email",
                  "enabled": false,
                  "to": "{{email}}",
                  "subject": "Your order is being processed",
                  "content": "Your order ({{reference}}) is being processed and we'll let you know once it's been shipped.",
                  "_key": 1613655093885
                }
              ],
              "type":"transactions",
              "protect":true
            }

            let order_receipt = {
              "name": "Send Receipt",
              "trigger": "order_receipt",
              "description": "Notification sent once customer has successfully paid. The customer can choose their notification method here, so only one 'email' action is recommended - otherwise they may receive two notifications.",
              "actions": [
                {
                  "method": "email",
                  "to": "{{email}}",
                  "enabled": true,
                  "subject": "Order: {{reference}}",
                  "content": "Thanks for your order! We'll send you another notification once it's been dispatched. For any queries please contact on 0161 379 8778",
                  "_key": 1613473542339
                }
              ],
              "type":"transactions",
              "protect":true
            }

            let order_shipped = {
              "name": "Order Shipped",
              "trigger": "order_shipped",
              "description": "Notification sent when the order has been shipped",
              "actions": [
                {
                  "method": "email",
                  "to": "{{email}}",
                  "enabled": true,
                  "subject": "Order: {{reference}}",
                  "content": "Your order has been dispatched and will be with you shortly.",
                  "_key": 1613660198773
                }
              ],
              "type":"transactions",
              "protect":true
            }

            let order_refunded = {
              "name": "Order Refunded",
              "trigger": "order_refunded",
              "description": "Notification sent when the order has been refunded",
              "actions": [
                {
                  "method": "email",
                  "to": "{{email}}",
                  "enabled": true,
                  "subject": "Refund: {{reference}}",
                  "content": "Your order has been refunded via your original payment method.",
                  "_key": 1613660198773
                }
              ],
              "type":"transactions",
              "protect":true
            }

            new Automations(order_processing).saveIfNotExists(['trigger == order_processing'])
            new Automations(order_receipt).saveIfNotExists(['trigger == order_receipt'])
            new Automations(order_shipped).saveIfNotExists(['trigger == order_shipped'])
            new Automations(order_refunded).saveIfNotExists(['trigger == order_refunded'])

        }

        async registerMenus(){

            let menus = {
                menu: {
                    dashboard: [
                        {link:'Transactions',slug:'transactions/new', weight:1, query:'/dashboard/transactions/stats', protected_guards:['admin']}
                    ],
                    reports: [
                        {link:'Sales', weight:1, slug:'transactions/total-sales', description:'Shows a sales breakdown over a specified period', inputs:['date_from','date_to']},
                        {link:'Best Sellers', weight:1, slug:'transactions/best-sellers', description:'Shows the top 10 selling products in a specified period', inputs:['date_from','date_to']},
                        {link:'Top Customers', weight:1, slug:'transactions/best-customers', description:'Shows the top 30 customers in a specified period', inputs:['date_from','date_to']}
                    ]
                }
            }

            global.addMenu(menus)
            return this

        }

        async totalSales(query_data){

            if (!query_data){
                query_data = {}
            }

            if (!query_data.date_from || query_data.date_from == 'null'){
                query_data.date_from = moment().set({hours:0, minutes:0, seconds:0}).subtract(30, 'days').toISOString()
            }

            if (!query_data.date_to || query_data.date_to == 'null'){
                query_data.date_to = moment().set({hours:23, minutes:59, seconds:59}).toISOString()
            }

            let transactions = await this.all(['_created > '+query_data.date_from,'_created < '+query_data.date_to]),
                carts = await new Cart().all(['_created > '+query_data.date_from,'_created < '+query_data.date_to]),
                moment_from = moment(query_data.date_from),
                moment_to = moment(query_data.date_to),
                total = 0,
                net_total = 0,
                shipping_total = 0,
                items_total = 0,
                items_sale_total = 0,
                items_non_sale_total = 0,
                total_without_shipping = 0,
                transactions_per_day = {},
                transactions_per_day_totals = [],
                transactions_per_day_labels = [],
                day,
                current_day,
                current_day_total = 0,
                product_cats = {},
                product_cats_totals = [],
                product_cats_labels = [],
                payment_methods = {},
                payment_methods_totals = [],
                payment_methods_labels = []

            // let total = transactions.data.map(item => parseInt(item.total))
            //         .reduce((prev, next) => prev + next)

            transactions.data.map((transaction) => {

                transaction.items.map((item)=>{

                    let slug = item.slug.split('/')
                    slug.pop()
                    slug = slug.join('-')

                    if (product_cats[slug]){
                        product_cats[slug]++
                    } else {
                        product_cats[slug] = 1
                    }

                    items_total += item.quantity

                    if (item.adjustment){
                        items_sale_total += item.quantity
                    } else {
                        items_non_sale_total += item.quantity
                    }

                })

                day = moment(transaction._created).format('Do-MMM')

                if (!current_day){
                    current_day = day
                }

                if (day == current_day){
                    current_day_total += parseInt(transaction.total)/100
                } else {
                    transactions_per_day[current_day] = current_day_total.toFixed(2)
                    current_day_total = parseInt(transaction.total)/100
                }

                current_day = day

                total += parseInt(transaction.total)
                net_total += parseInt(transaction.sub_total)
                shipping_total += parseInt(transaction.shipping_total)
                total_without_shipping += parseInt(transaction.item_total)

                if (transaction.payment_method){

                    if (!payment_methods[transaction.payment_method]){
                        payment_methods[transaction.payment_method] = 0
                    }
                    payment_methods[transaction.payment_method]++

                }

            })

            transactions_per_day[current_day] = current_day_total.toFixed(2)

            for (var [cat,val] of Object.entries(product_cats)){
                product_cats_totals.push(val)
                product_cats_labels.push(view.functions.capitalise(cat.replace(/^-/,'').replace(/-/g,' ')))
            }

            for (var [method,val] of Object.entries(payment_methods)){
                payment_methods_totals.push(val)
                payment_methods_labels.push(view.functions.capitalise(method.replace(/^-/,'').replace(/-/g,' ')))
            }

            while (moment_from.isBefore(moment_to, 'day') || moment_from.isSame(moment_to, 'day')) {

                let obj_ref = moment_from.format('Do-MMM')

                if (transactions_per_day[obj_ref]){
                    transactions_per_day_totals.push(transactions_per_day[obj_ref])
                } else {
                    transactions_per_day_totals.push(0)
                }

                transactions_per_day_labels.push(view.functions.capitalise(obj_ref.replace(/^-/,'').replace(/-/g,' ')))

                moment_from.add(1, 'days')

            }

            let result = [
                {label:'Transactions',type:'value', tip:'Total number of transactions processed within this date range', data:transactions.data.length},
                {label:'Items Sold',type:'value', tip:'Total number of items sold', data:items_total},
                {label:'Gross',type:'value',format:'currency', tip:'Total of all transactions inc. VAT and shipping', data:(total/100).toFixed(2)},
                {label:'Net',type:'value',format:'currency', tip:'Total of all transactions minus VAT', data:(net_total/100).toFixed(2)},
                {label:'Shipping',type:'value',format:'currency', tip:'Shipping totals', data:(shipping_total/100).toFixed(2)},
                {label:'Avg. Sale',type:'value',format:'currency', tip:'Average sale price within this date range, inc. VAT, not inc. shipping', data:((total_without_shipping/100)/transactions.data.length).toFixed(2)},
                // {label:'Median Sale',type:'value',format:'currency', data:view.functions.findMedian(transactions_per_day_total)},
                {label:'Product Categories',type:'chart',format:'doughnut', data:{
                    values: product_cats_totals,
                    colors: view.functions.gradient('#FD7278','#72adfc',product_cats_labels.length),
                    labels: product_cats_labels
                }},
                {label:'Products sold at',type:'chart',format:'doughnut', data:{
                    values: [items_non_sale_total,items_sale_total],
                    colors: view.functions.gradient('#FD7278','#72adfc',2),
                    labels: ['Regular price', 'Sale price']
                }},
                {label:'Conversions',type:'chart',format:'doughnut', data:{
                    values: [transactions.data.length,carts.data.length],
                    colors: view.functions.gradient('#FD7278','#72adfc',2),
                    labels: ['Converted', 'Abandoned']
                }},
                {label:'Payment Methods',type:'chart',format:'doughnut', data:{
                    values: payment_methods_totals,
                    colors: view.functions.gradient('#FD7278','#72adfc',2),
                    labels: payment_methods_labels
                }},
                {label:'Totals Per Day (£)',type:'chart',format:'bar', tip:'Total sales (£) broken down into each day of the selected data range', data:{
                    values: transactions_per_day_totals,
                    colors: view.functions.gradient('#FD7278','#72adfc',transactions_per_day_totals.length),
                    labels: transactions_per_day_labels
                }}
            ]

            let payload = {
                name:'Sales',
                description: 'Shows a sales breakdown over a specified period',
                result:result,
                model:'Transactions',
                date_from: query_data.date_from,
                date_to: query_data.date_to
            }

            await new Reports(payload).save()
            return total

        }

        async bestSellers(query_data){

            if (!query_data){
                query_data = {}
            }

            if (!query_data.date_from || query_data.date_from == 'null'){
                query_data.date_from = moment().set({hours:0, minutes:0, seconds:0}).subtract(30, 'days').toISOString()
            }

            if (!query_data.date_to || query_data.date_to == 'null'){
                query_data.date_to = moment().set({hours:23, minutes:59, seconds:59}).toISOString()
            }

            let transactions = await this.all(['_created > '+query_data.date_from,'_created < '+query_data.date_to]),
                items_total = 0,
                products = [],
                products_totals = [],
                products_labels = [],
                best_seller = {}

            transactions.data.map((transaction) => {

                transaction.items.map((item)=>{

                    let idx = products.findIndex((itm)=>{
                        return itm._key == item._key
                    })

                    if (idx >= 0){
                        products[idx].count += item.quantity
                    } else {
                        products.push({_key:item._key, name:item.name, count:1, price:item.price})
                    }
                    items_total += item.quantity

                })

            })

            products.sort((a,b)=>{
                return b.count - a.count
            })

            for (let val of products){

                products_totals.push(val.count)
                products_labels.push(view.functions.capitalise(val.name.replace(/^-/,'').replace(/-/g,' ')))

                if (products_totals.length == 10){
                    break
                }
            }

            let result = [
                {label:'Transactions',type:'value', tip:'Total number of transactions processed within this date range', data:transactions.data.length},
                {label:'Items Sold',type:'value', tip:'Total number of items sold', data:items_total},
                {label:'Product Sales',type:'chart',format:'bar', data:{
                    values: products_totals,
                    colors: view.functions.gradient('#FD7278','#72adfc',products_totals.length),
                    labels: products_labels
                }}
            ]

            let payload = {
                name:'Best Sellers',
                description: 'Shows the top 10 selling products in a specified period',
                result:result,
                model:'Transactions',
                date_from: query_data.date_from,
                date_to: query_data.date_to
            }

            await new Reports(payload).save()
            return 'done'

        }

        async bestCustomers(query_data){

            if (!query_data){
                query_data = {}
            }

            if (!query_data.date_from || query_data.date_from == 'null'){
                query_data.date_from = moment().set({hours:0, minutes:0, seconds:0}).subtract(30, 'days').toISOString()
            }

            if (!query_data.date_to || query_data.date_to == 'null'){
                query_data.date_to = moment().set({hours:23, minutes:59, seconds:59}).toISOString()
            }

            let transactions = await this.all(['_created > '+query_data.date_from,'_created < '+query_data.date_to]),
                items_total = 0,
                customers = [],
                customers_totals = [],
                customers_labels = []

            transactions.data.map((transaction) => {

                if (transaction.customer && transaction.customer._key){
                    let idx = customers.findIndex((itm)=>{
                        return itm._key == transaction.customer._key
                    })

                    if (idx >= 0){
                        customers[idx].spent += parseInt(transaction.total)/100
                    } else {
                        customers.push({_key:transaction.customer._key, name:transaction.customer.full_name, spent:parseInt(transaction.total)/100})
                    }
                }

            })

            customers.sort((a,b)=>{
                return b.spent - a.spent
            })

            for (let val of customers){

                customers_totals.push(val.spent)
                customers_labels.push(val.name)

                if (customers_totals.length == 30){
                    break
                }
            }

            let result = [
                {label:'Transactions',type:'value', tip:'Total number of transactions processed within this date range', data:transactions.data.length},
                {label:'Customer Sales (£)',type:'chart',format:'bar', data:{
                    values: customers_totals,
                    colors: view.functions.gradient('#FD7278','#72adfc',customers_totals.length),
                    labels: customers_labels
                }}
            ]

            let payload = {
                name:'Top Customers',
                description: 'Shows the top 30 customers in a specified period',
                result:result,
                model:'Transactions',
                date_from: query_data.date_from,
                date_to: query_data.date_to
            }

            await new Reports(payload).save()
            return 'done'

        }


    }

    module.exports = Transactions
