
    const Models = require(basedir+'/modules/Models')

    class Products extends Models {

        constructor(data){

            super(data)

            this.settings = {
                collection: 'products',
                fields: [
                    {name:'gallery',input_type:'img_array',placeholder:'Images', type:'object', tab:'images', thumbnail:true, required:false},
                    {name:'name',input_type:'text',placeholder:'Name', type:'string', required:true},
                    {name:'brand',input_type:'text',placeholder:'Brand', type:'string', required:false},
                    {name:'slug',input_type:'text',placeholder:'URL', type:'slug', required:false},
                    {name:'barcode',input_type:'text',placeholder:'barcode', type:'barcode', required:false, barcode_type:'ean13'},
                    {name:'category',input_type:'select',option_data:'ProductCategories', type:'string', required:false},
                    {name:'sub_category',input_type:'select', option_for:'sub_category in sub_categories',type:'string', required:false},
                    {name:'variants',input_type:'multiselect',option_data:'products', tab:'product_variants', type:'string', required:false},
                    {name:'price',input_type:'text',placeholder:'Price',type:'price', tab:'prices and stock',required: true},
                    {name:'trade_price',input_type:'text',placeholder:'Trade Price',type:'price', tab:'prices and stock',required: false},
                    {name:'vat',input_type:'number',placeholder:'VAT as decimal',type:'number', tab:'prices and stock',required: false},
                    {name:'adjustment',input_type:'text',placeholder:'Eg, -10%, -£1', tab:'prices and stock',type:'discount',required: false},
                    {name:'stock',input_type:'number',placeholder:'Stock Amount', type:'number', tab:'prices and stock',  required:false},
                    {name:'sku',input_type:'sku',placeholder:'Unique Product Code', tab:'prices and stock',type:'sku',required: false},
                    {name:'items_per_customer',input_type:'number',placeholder:'Items per customer', tab:'prices and stock', type:'number', required:false},
                    {name:'active',input_type:'checkbox',type:'boolean', tab:'prices and stock',required: false},
                    {name:'requires_delivery',input_type:'checkbox',type:'boolean', tab:'prices and stock',required: false},
                    {name:'made_to_order',input_type:'checkbox',type:'boolean', tab:'prices and stock',required: false},
                    {name:'promo_text',input_type:'text',placeholder:'Eg, award winning, our favourite', tab:'prices and stock',type:'string',required: false},
                    {name:'attributes',input_type:'array', tab:'product_attributes', placeholder:'Attributes',type:'array',required: false, subitems:[
                        {name:'attribute',input_type:'select', option_data:'ProductAttributes', type:'string', required:false},
                        {name:'value',input_type:'textarea', type:'data', required:false}
                    ]},
                    {name:'customisation',input_type:'array',placeholder:'Customisation', tab:'product_customisation', type:'object',required: false},
                    {name:'description',input_type:'textarea',placeholder:'Description', type:'string', truncate:160, required:false},
                    {name:'keywords',input_type:'array',placeholder:'Keywords', type:'array', required:false},
                    {name:'content',input_type:'contenteditable',placeholder:'Content', type:'string', required:false}
                ],
                search_fields:['name','brand', 'barcode', 'sku', 'keywords']
            }

            this.routes = {
                public: { // unauth'd routes
                    get: {
                        all:[],
                        search:[],
                        find:[]
                    },
                },
                private: { // auth'd routes
                    get: {
                        getInactive:['admin'],
                        parseUrls:['admin'],
                        updateAllergens:['admin']
                    },
                    post: {
                        save:['admin']
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


        async updateStock(key, quantity){

            return new Promise( async (resolve, reject) => {

                let item = await new Products().find(key)

                if (item.data && item.data.made_to_order === true){

                    resolve()

                } else if (item.data && item.data.stock){

                    item.data.stock = parseInt(item.data.stock)-parseInt(quantity)

                    let automation_payload = item.data

                    let payload = {
                        _key: item.data._key,
                        stock: item.data.stock
                    }
                //    item.data.stock = parseInt(item.data.stock)-parseInt(quantity)

                    item.save(payload)

                    if (item.data.stock < 1){
                        new Automations('out_of_stock').trigger(automation_payload)
                    } else if (item.data.stock < 6){
                        new Automations('low_stock').trigger(automation_payload)
                    }

                }
                resolve()

            })

        }

        async preSave(){

            let category_slug = await new ProductCategories().slug(this.data)

            if (category_slug){
                this.data.url = category_slug+this.data.slug
            }

        }

        async getRelated(){

            let related

            if (this.data && this.data.category && this.data.sub_category){
                related = await new Products().all(['category == "'+this.data.category+'"', 'sub_category == "'+this.data.sub_category+'"', '_key != '+this.data._key,'active == true'])
            } else if (this.data && this.data.category){
                related = await new Products().all(['category == '+this.data.category+'"', '_key != '+this.data._key, 'active == true'])
            } else {
                related = false
            }

            return related.data

        }

        async getMostRecent(){

            return await DB.read(this.settings.collection).where(['activated == true']).orderBy('_updated','DESC').limit(5).data

        }

        async getInactive(){

            return await DB.read(this.settings.collection).orWhere(['category has no value','active has no value','category has no value','active == false','slug has no value']).orderBy('_updated','DESC').get()

        }

        async parseUrls(){

            let products = await DB.read(this.settings.collection).show(['_key']).get(),
                product

            if (products.length > 0){
                for (var item of products){

                    product = await new Products().find(item._key)
                    if (product){
                        product.save()
                    }


                }
            }

            return products

        }

        makeCartResource(requested_item){

            return new Promise( async (resolve, reject) => {

                let category_slug = await new ProductCategories().slug(this.data)

                if (requested_item.trade_guard && requested_item.trade_key && this.data.trade_price){

                    let trade_user = await new global[parseClassName(requested_item.trade_guard)]().find(requested_item.trade_key)

                    if (trade_user && trade_user.data && trade_user.data.activated && trade_user.data.activated == true){
                        this.data.price = this.data.trade_price
                    }

                }

                resolve({
                    _key: this.data._key,
                    price: this.data.price,
                    vat: this.data.vat,
                    thumbnail: this.data.thumbnail,
                    name: this.data.name,
                    slug: category_slug+this.data.slug,
                    stock: this.data.stock,
                    activated: this.data.activated,
                    adjustment: this.data.adjustment,
                    items_per_customer: this.data.items_per_customer
                })

            })

        }

        registerAutomations(){

            let low_stock = {
                name: "Low Stock",
                trigger: "low_stock",
                description: "Notification when a product has fewer than 5 items left in stock",
                actions: [
                    {
                        method: "email",
                        enabled: true,
                        to: "{{admin_email}}",
                        subject: "Low stock for {{name}}",
                        content: "{{name}} only has {{stock}} left",
                        _key: 1613655093885
                    }
                ],
                type:"products",
                protect: true
            }

            let out_of_stock = {
                name: "Out of Stock",
                trigger: "out_of_stock",
                description: "Notification when a product is out of stock",
                actions: [
                    {
                        method: "email",
                        enabled: true,
                        to: "{{admin_email}}",
                        subject: "Out of stock for {{name}}",
                        content: "{{name}} is currently out of stock and can no longer be purchased",
                        _key: 1613655093886
                    }
                ],
                type:"products",
                protect: true
            }

            new Automations(low_stock).saveIfNotExists(['trigger == low_stock'])
            new Automations(out_of_stock).saveIfNotExists(['trigger == out_of_stock'])

        }

        async registerMenus(){

            let menus = {
                menu: {
                    dashboard: [
                        {slug:'products/new', weight:2, link:'Add a new product', protected_guards:['admin']}
                    ]
                }
            }

            global.addMenu(menus)
            return this

        }


    }

    module.exports = Products
