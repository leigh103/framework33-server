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
                    {link:'Attributes',slug: '/dashboard/products/attributes', weight:3}
                ]}
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
        include_styles: [settings.views+'/styles/style.ejs']
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

        view.current_view = 'products'
        view.current_sub_view = 'categories'
        data.include_scripts = ['dashboard/views/scripts/script.ejs']

        data.title = 'Product Categories'
        data.table = 'product_categories'

        data.fields = new ProductCategories().settings.fields

        res.render(basedir+'/components/dashboard/views/table.ejs',data)

    })

    routes.get('/dashboard/products/attributes', async(req, res) => {

        view.current_view = 'products'
        view.current_sub_view = 'attributes'
        data.include_scripts = ['dashboard/views/scripts/script.ejs']

        data.title = 'Product Attributes'
        data.table = 'product_attributes'

        data.fields = new ProductAttributes().settings.fields

        res.render(basedir+'/components/dashboard/views/table.ejs',data)

    })

    routes.get('/dashboard/products/:key?', async(req, res) => {

        view.current_view = 'products'
        view.current_sub_view = 'all products'
        data.include_scripts = ['dashboard/views/scripts/script.ejs','products/views/scripts/products.ejs']

        data.title = 'Products'
        data.table = 'products'

        data.fields = new Products().settings.fields

        res.render(settings.views+'/dashboard/products.ejs',data)

    })

    routes.get('/:category/:slug?', async (req, res, next) => {

        data.cart = await new Cart().init(req)

        res.locals.functions = functions

        data.include_scripts = ['transactions/views/scripts/script.ejs','products/views/scripts/products_client.ejs']

        let category, slug

        if (req.params.slug){

            data.category = await new ProductCategories().find(['slug == '+req.params.category])
            data.slug = req.params.slug
            data.product = await new Products().find(['slug == '+data.slug])
            data.product = data.product.get()
            view.meta.title = 'Framework-33 | '+data.product.name

            if (data.product.description){
                view.meta.description = data.product.description.substring(0,160)
            }

            res.render(settings.views+'/product.ejs',data)

        } else {

            data.category = await new ProductCategories().find(['slug == '+req.params.category])

            if (!data.category || data.category && data.category.data && !data.category.data.name){
                next()
            } else {
                view.meta.title = 'Framework-33 | '+data.category.data.name
                if (data.category.data.description){
                    view.meta.description = data.category.data.description.substring(0,160)
                }
                data.products = await new Products().all(['category like '+data.category.data._key])
                data.products = data.products.data
                res.render(settings.views+'/category.ejs',data)
            }

        }

    })


// export


    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
