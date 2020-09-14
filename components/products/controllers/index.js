//
// Products Component
// Dashboard and frontend CMS
//


// vars

const express = require('express'),
    routes = express.Router(),

    settings = {
        default_route: 'root',
        views: 'products/views',
        menu: {
            side_nav: [
                {link:'Products',slug: '/dashboard/products', weight:1, subitems:[
                    {link:'All Products',slug: '/dashboard/products', weight:1},
                    {link:'Categories',slug: '/dashboard/products/categories', weight:2},
                    {link:'Attributes',slug: '/dashboard/products/attributes', weight:3},
                    {link:'Settings',slug: '/dashboard/products/settings', weight:4}
                ]}
            ],
            nav: [
                {link:'Shop',slug: view.ecommerce.shop.slug, weight:1}
            ]
        }
    },


// methods


    functions = {

        getPrice: (price, adjustment) => {

            if (adjustment){

                if (adjustment.match(/%/)){

                    adjustment_value = adjustment.replace(/%/,'')
                    adjustment_value = (price/100)*adjustment_value
                    return (parseFloat(price)+parseFloat(adjustment_value)).toFixed(2)

                } else {

                    return (parseFloat(price)+parseFloat(adjustment)).toFixed(2)

                }

            } else {
                return price
            }

        }

    }


// routes


    let data = {
        shop: view.ecommerce.shop,
        meta: {},
        include_styles: [settings.views+'/styles/style.ejs','dashboard/views/styles/dashboard-style.ejs']
    }

    routes.get('*', (req, res, next) => {
        if (req.session && req.session.user && req.session.user.guard){
            data.user = req.session.user
        } else {
            data.user = {}
        }
        next()
    })

    routes.get('/dashboard/products/categories', async(req, res) => {

        data.meta = {
            title: config.site.name+' | Product Categories'
        }

        view.current_view = 'products'
        view.current_sub_view = 'categories'
        data.include_scripts = ['dashboard/views/scripts/script.ejs']

        data.title = 'Product Categories'
        data.table = 'product_categories'

        data.fields = new ProductCategories().settings.fields

        res.render(basedir+'/components/dashboard/views/table.ejs',data)

    })

    routes.get('/dashboard/products/attributes', async(req, res) => {

        data.meta = {
            title: config.site.name+' | Product Attributes'
        }

        view.current_view = 'products'
        view.current_sub_view = 'attributes'
        data.include_scripts = ['dashboard/views/scripts/script.ejs']

        data.title = 'Product Attributes'
        data.table = 'product_attributes'

        data.fields = new ProductAttributes().settings.fields

        res.render(basedir+'/components/dashboard/views/table.ejs',data)

    })

    routes.get('/dashboard/products/settings', async(req, res) => {

        data.meta = {
            title: config.site.name+' | Product Settings'
        }

        view.current_view = 'products'
        view.current_sub_view = 'settings'
        data.include_scripts = ['dashboard/views/scripts/script.ejs']

        data.title = 'Product Settings'
        data.table = 'product_settings'

        data.fields = new ProductSettings().settings.fields

        res.render(settings.views+'/dashboard/product_settings.ejs',data)
    //    res.render(basedir+'/components/dashboard/views/table.ejs',data)

    })

    routes.get('/dashboard/products/:key?', async(req, res) => {

        data.meta = {
            title: config.site.name+' | Products'
        }

        view.current_view = 'products'
        view.current_sub_view = 'all products'
        data.include_scripts = ['dashboard/views/scripts/script.ejs','products/views/scripts/products.ejs']

        data.title = 'Products'
        data.table = 'products'

        data.fields = new Products().settings.fields

        res.render(settings.views+'/dashboard/products.ejs',data)

    })

    routes.get('/:shop_slug', async (req, res, next) => {

        if (req.params.shop_slug == view.ecommerce.shop.slug){

            data.shop = view.ecommerce.shop
            data.meta.title = config.site.name+' | '+view.ecommerce.shop.name
            if (data.shop.description){
                data.meta.description = data.shop.description.substring(0,160)
            }
            data.categories = await new ProductCategories().all()
            data.categories = data.categories.data
            res.render(config.site.theme_path+'/templates/products/categories.ejs',data)

        } else {
            next()
        }

    })

    routes.get('/:category/:sub_category?/:product?', async (req, res, next) => {

        data.cart = await new Cart().init(req)

        res.locals.functions = functions

        data.include_scripts = ['transactions/views/scripts/script.ejs','products/views/scripts/products_client.ejs']

        data.category = await new ProductCategories().find(['slug == '+req.params.category])

        if (!data.category || data.category && data.category.data && !data.category.data.name){ // if a cateoory is not found, go on to try other routes

            next()

        } else {

            data.category = data.category.data

            if (req.params.product){ // get product

                data.sub_category = data.category.sub_categories.find((sub_category,i)=>{
                    return sub_category.slug == req.params.sub_category
                })

                data.slug = req.params.product
                data.product = await new Products().find(['slug == '+data.slug])
                data.product = data.product.get()

                if (data.product){

                    data.meta.title = config.site.name+' | '+data.product.name

                    if (data.product.description){
                        data.meta.description = data.product.description.substring(0,160)
                    }

                    res.render(config.site.theme_path+'/templates/products/product.ejs',data)

                } else {
                    next()
                }

            } else if (req.params.sub_category && !req.params.product){ // check for sub category first, if not, then check products

                if (data.category && data.category.sub_categories && data.category.sub_categories.length > 0){
                    data.sub_category = data.category.sub_categories.find((sub_category,i)=>{
                        return sub_category.slug == req.params.sub_category
                    })
                } else {
                    data.sub_category = false
                }

                if (data.sub_category){ // it's a sub category

                    data.parent_category = data.category
                    data.category = data.sub_category
                    data.meta.title = config.site.name+' | '+data.sub_category.name
                    if (data.sub_category.description){
                        data.meta.description = data.sub_category.description.substring(0,160)
                    }
                    data.products = await new Products().all(['category like '+data.parent_category._key, 'sub_category like '+data.sub_category._key])
                    data.products = data.products.data
                    res.render(config.site.theme_path+'/templates/products/category.ejs',data)

                } else { // check if it's a product

                    data.slug = req.params.sub_category
                    data.product = await new Products().find(['slug == '+data.slug])
                    data.product = data.product.get()

                    if (data.product){

                        data.meta.title = config.site.name+' | '+data.product.name

                        if (data.product.description){
                            data.meta.description = data.product.description.substring(0,160)
                        }

                        res.render(config.site.theme_path+'/templates/products/product.ejs',data)

                    } else {
                        next()
                    }

                }

            } else { // top level category

                delete data.parent_category
                data.meta.title = config.site.name+' | '+data.category.name
                if (data.category.description){
                    data.meta.description = data.category.description.substring(0,160)
                }
                data.products = await new Products().all(['category like '+data.category._key,'sub_category NOT EXISTS'])
                data.products = data.products.data
                res.render(config.site.theme_path+'/templates/products/category.ejs',data)

            }

        }

    })


// export


    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
