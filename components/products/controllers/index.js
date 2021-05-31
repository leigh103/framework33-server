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
                {link:'Products',slug: '/dashboard/products', icon:'<span class="icon box"></span>', protected_guards:['admin'], weight:3, subitems:[
                    // {link:'All',slug: '/dashboard/products', weight:1},
                    // {link:'Inactive',slug: '/dashboard/products/inactive', weight:5},
                    // {link:'Sale Items',slug: '/dashboard/products/sale', weight:6},
                    {link:'Categories',slug: '/dashboard/products/categories', icon:'<span class="icon box"></span>', weight:3},
                    {link:'Attributes',slug: '/dashboard/products/attributes', icon:'<span class="icon box"></span>', weight:4}
                ]}
            ]
        }
    },


// methods


    functions = {

        getSlug: async (product) => {

            return await new ProductCategories().slug(product)

        }

    }


// routes


    let data = {
        shop: view.ecommerce.shop,
        meta: {},
        include_styles: [settings.views+'/styles/style.ejs','dashboard/views/styles/dashboard-style.ejs'],
        tabs: [{href: '/dashboard/products', text:'Active'},{href: '/dashboard/products/inactive', text:'Inactive'},{href: '/dashboard/products/on-sale', text:'On Sale'},{href: '/dashboard/products/categories', text:'Categories'},{href: '/dashboard/products/attributes', text:'Attributes'},{href: '/dashboard/products/collections', text:'Collections'}]
    }

    let models = {
        products: new Products(),
        categories: new ProductCategories(),
        collections: new ProductCollections(),
        attributes: new ProductAttributes()
    }

    routes.get('*', (req, res, next) => {
        if (req.session && req.session.user && req.session.user.guard){
            data.user = req.session.user
        } else {
            data.user = {}
        }
        next()
    })

    routes.get('/dashboard/product_categories/:key?', async(req, res) => {
        let url = '/dashboard/products/categories'
        if (req.params.key){
            url += '/'+req.params.key
        }
        res.redirect(url)
    })

    routes.get('/dashboard/product_collections/:key?', async(req, res) => {
        let url = '/dashboard/products/collections'
        if (req.params.key){
            url += '/'+req.params.key
        }
        res.redirect(url)
    })

    routes.get('/dashboard/product_attributes/:key?', async(req, res) => {
        let url = '/dashboard/products/attributes'
        if (req.params.key){
            url += '/'+req.params.key
        }
        res.redirect(url)
    })

    routes.get('/dashboard/products/categories/:key?', async(req, res) => {

        data.meta = {
            title: config.site.name+' | Product Categories'
        }

        view.current_view = 'products'
        view.current_sub_view = 'categories'
        data.include_scripts = ['dashboard/views/scripts/script.ejs','products/views/scripts/product_categories.ejs']
        data.include_styles = [settings.views+'/styles/dashboard_style.ejs']

        data.query = ''
        data.title = 'Product Categories'
        data.table = 'product_categories'

        data.context_menu = [
            {function: "showCategoryProducts",text:"Products", icon:"box"}
        ]

        data.model = models.categories

        if (req.params.key){
            data.key = req.params.key
            data.fields = await data.model.parseEditFields()
            res.render(basedir+'/components/dashboard/views/edit.ejs',data)
        } else {
            data.fields = data.model.settings.fields
            data.search_fields = data.model.settings.search_fields
            res.render(basedir+'/components/dashboard/views/table.ejs',data)
        }

    })

    routes.get('/dashboard/products/attributes/:key?', async(req, res) => {

        data.meta = {
            title: config.site.name+' | Product Attributes'
        }

        view.current_view = 'products'
        view.current_sub_view = 'attributes'
        data.include_scripts = ['dashboard/views/scripts/script.ejs','products/views/scripts/products.ejs']

        data.query = ''
        data.title = 'Product Attributes'
        data.table = 'product_attributes'

        data.model = models.attributes

        if (req.params.key){
            data.key = req.params.key
            data.fields = await data.model.parseEditFields()
            res.render(basedir+'/components/dashboard/views/edit.ejs',data)
        } else {
            data.fields = data.model.settings.fields
            data.search_fields = data.model.settings.search_fields
            res.render(basedir+'/components/dashboard/views/table.ejs',data)
        }

    })

    routes.get('/dashboard/products/collections/:key?', async(req, res) => {

        data.meta = {
            title: config.site.name+' | Product Collections'
        }

        view.current_view = 'products'
        view.current_sub_view = 'collections'
        data.include_scripts = ['dashboard/views/scripts/script.ejs','products/views/scripts/products.ejs']

        data.query = ''
        data.title = 'Product Collections'
        data.table = 'product_collections'

        data.model = models.collections

        if (req.params.key){
            data.key = req.params.key
            data.fields = await data.model.parseEditFields()
            res.render(basedir+'/components/dashboard/views/edit.ejs',data)
        } else {
            data.fields = data.model.settings.fields
            data.search_fields = data.model.settings.search_fields
            res.render(basedir+'/components/dashboard/views/table.ejs',data)
        }

    })

    routes.get('/dashboard/products/settings', async(req, res) => {

        data.meta = {
            title: config.site.name+' | Product Settings'
        }

        view.current_view = 'products'
        view.current_sub_view = 'settings'
        data.include_scripts = ['dashboard/views/scripts/script.ejs','products/views/scripts/products.ejs']

        data.query = ''
        data.title = 'Product Settings'
        data.table = 'product_settings'

        data.fields = new ProductSettings().settings.fields

        res.render(settings.views+'/dashboard/product_settings.ejs',data)
    //    res.render(basedir+'/components/dashboard/views/table.ejs',data)

    })

    routes.get('/dashboard/products/inactive', async(req, res) => {

        data.meta = {
            title: config.site.name+' | Inactive Products'
        }

        view.current_view = 'products'
        view.current_sub_view = 'inactive'
        data.include_scripts = ['dashboard/views/scripts/script.ejs','products/views/scripts/products.ejs']
        data.include_styles = [settings.views+'/styles/dashboard_style.ejs']

        data.title = 'Inactive Products'
        data.table = 'products'

        data.query = '/get-inactive'

        data.model = models.products

        data.fields = data.model.settings.fields
        data.search_fields = data.model.settings.search_fields
        return res.render(basedir+'/components/dashboard/views/table.ejs',data)

        res.render(basedir+'/components/dashboard/views/edit.ejs',data)

    })

    routes.get('/dashboard/products/on-sale', async(req, res) => {

        data.meta = {
            title: config.site.name+' | Inactive Products'
        }

        view.current_view = 'products'
        view.current_sub_view = 'On Sale'
        data.include_scripts = ['dashboard/views/scripts/script.ejs','products/views/scripts/products.ejs']
        data.include_styles = [settings.views+'/styles/dashboard_style.ejs']

        data.title = 'On Sale Products'
        data.table = 'products'

        data.query = '?adjustment=has_value'

        data.model = models.products

        data.fields = data.model.settings.fields
        data.search_fields = data.model.settings.search_fields
        return res.render(basedir+'/components/dashboard/views/table.ejs',data)

        res.render(basedir+'/components/dashboard/views/edit.ejs',data)

    })

    routes.get('/dashboard/products/new', async(req, res) => {

        data.meta = {
            title: config.site.name+' | Add New Product'
        }

        view.current_view = 'products'
        view.current_sub_view = 'all'
        data.include_scripts = ['dashboard/views/scripts/script.ejs','products/views/scripts/products.ejs']
        data.include_styles = [settings.views+'/styles/dashboard_style.ejs']

        data.title = 'Add New Product'
        data.table = 'products'

        data.query = '?limit=30'

        data.model = models.products

        data.key = 'new'
    //    data.option_data = await view.functions.getOptionData('product_categories')
        data.fields = await data.model.parseEditFields()

        res.render(basedir+'/components/dashboard/views/edit.ejs',data)

    })

    routes.get('/dashboard/products/:key?/:cat?/:sub_cat?', async(req, res) => {

        data.meta = {
            title: config.site.name+' | Products'
        }

        view.current_view = 'products'
        view.current_sub_view = 'products'
        data.include_scripts = ['dashboard/views/scripts/script.ejs','products/views/scripts/products.ejs']
        data.include_styles = [settings.views+'/styles/dashboard_style.ejs']

        data.title = 'Products'
        data.table = 'products'

        data.query = '?limit=30'

        data.model = models.products

        if (req.params.key == 'category' && req.params.cat){

            let cat_id = req.params.cat+'',
                sub_cat_id,
                category = await new ProductCategories().find(req.params.cat)
            if (category.data && category.data.name){
                data.title = category.data.name
            }

            if (req.params.sub_cat){

                sub_cat_id = req.params.sub_cat

                let sub_cat = category.data.sub_categories.find((sub)=>{
                    return sub._key == sub_cat_id
                })
                if (sub_cat && sub_cat.name){
                    data.title += ' / '+sub_cat.name
                }
            }

            data.query += '&category=%27'+cat_id+'%27'

            let idx = data.tabs.findIndex((item)=>{return item.text == data.title})

            if (sub_cat_id){
                data.query += '&sub_category=%27'+sub_cat_id+'%27'

                if (idx < 0){
                    data.tabs.push({href: '/dashboard/products/category/'+cat_id+'/'+sub_cat_id, text:data.title})
                }

            } else {
                if (idx < 0){
                    data.tabs.push({href: '/dashboard/products/category/'+cat_id, text:data.title})
                }
            }

            view.current_sub_view = data.title
            data.option_data = await view.functions.getOptionData('product_categories')
            data.fields = data.model.settings.fields
            data.search_fields = data.model.settings.search_fields

            return res.render(basedir+'/components/dashboard/views/table.ejs',data)

        } else if (req.params.key){

            data.key = req.params.key
            view.current_sub_view = 'details'
        //    data.option_data = await view.functions.getOptionData('product_categories')
            data.fields = await data.model.parseEditFields()

            return res.render(basedir+'/components/dashboard/views/edit.ejs',data)

        } else {

            view.current_sub_view = 'active'
            data.fields = data.model.settings.fields
            data.search_fields = data.model.settings.search_fields
            return res.render(basedir+'/components/dashboard/views/table.ejs',data)
        }

        //res.render(basedir+'/components/dashboard/views/table.ejs',data)

    })

    routes.get('/'+view.ecommerce.shop.slug, async (req, res) => {

        data.shop = view.ecommerce.shop
        data.meta.title = config.site.name+' | '+view.ecommerce.shop.name
        if (data.shop.description){
            data.meta.description = data.shop.description.substring(0,160)
        }
        data.categories = await new ProductCategories().all()
        data.categories = data.categories.data

        res.render(config.site.theme_path+'/templates/products/categories.ejs',data)

    })

    routes.get('/:category/:sub_category?/:product?', async (req, res, next) => {

        delete data.parent_category

        if (req.params.category == view.ecommerce.cart_name){
        //    console.log(req.params.category,view.ecommerce.cart_name)
            next()
            return
        }

        data.cart = await new Cart().init(req)
        req.session.cart_id = data.cart._key

        res.locals.functions = functions

        data.include_scripts = ['transactions/views/scripts/script.ejs','products/views/scripts/products_client.ejs']

        data.category = await models.categories.find(['slug == '+req.params.category])

        if (!data.category || data.category && data.category.data && !data.category.data.name){ // if a cateoory is not found, go on to try other routes

            next()

        } else {

            data.category = data.category.data

            if (req.params.product){ // get product

                data.sub_category = data.category.sub_categories.find((sub_category,i)=>{
                    return sub_category.slug == req.params.sub_category
                })

                data.slug = req.params.product

                data.product = await models.products.find(['slug == '+data.slug, 'active == true'])
                data.related = await data.product.getRelated()
                data.product = data.product.get()

                if (data.product){

                    data.product.url = config.site.url+'/'+req.params.category+'/'+req.params.sub_category+'/'+req.params.product

                    data.meta = view.functions.getMeta(data.product)

                    res.render(config.site.theme_path+'/templates/products/product.ejs',data)

                } else {
                    next()
                }

            } else if (req.params.sub_category && !req.params.product){ // check for sub category first, if not, then check products

                if (data.category && data.category.sub_categories && data.category.sub_categories.length > 0){
                    data.sub_category = data.category.sub_categories.find((sub_category,i)=>{
                        if (sub_category != null){
                            return sub_category.slug == req.params.sub_category
                        } else {
                            return false
                        }

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
                    data.products = await models.products.all(['category == '+data.parent_category._key, 'sub_category == '+data.sub_category._key, 'active == true'])
                    data.products = data.products.get()

                    res.render(config.site.theme_path+'/templates/products/category.ejs',data)

                } else { // check if it's a product

                    data.slug = req.params.sub_category

                    data.product = await models.products.find(['slug == '+data.slug, 'active == true'])
                    data.related = await data.product.getRelated()
                    data.product = data.product.get()

                    if (data.product){

                        data.product.url = config.site.url+'/'+req.params.category+'/'+req.params.sub_category

                        data.meta = view.functions.getMeta(data.product)

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

                data.products = await models.products.all(['category like '+data.category._key,'sub_category NOT EXISTS', 'active == true'])
                data.products = data.products.data
                res.render(config.site.theme_path+'/templates/products/category.ejs',data)

            }

        }

    })


// export


    module.exports = functions
    module.exports.routes = routes
    module.exports.settings = settings
