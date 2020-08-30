
    const bwipjs = require('bwip-js')

    class Image {

        constructor(data, type){

            if (!data){
                // this.error = "No data provided"
                // return this
                this.result
            } else {

                if (typeof data == 'object'){
                    this.code = data.code
                    this.type = data.type
                    this.save = data.save
                } else {
                    this.code = data
                    this.type = type
                    this.save = save
                }

            }

            this.routes = {
                public: { // unauth'd routes

                },
                private: { // auth'd routes
                    get: {

                    },
                    post: {
                        save:['admin'],
                        delete:['admin']
                    },
                    put: {
                        save:['admin']
                    },
                    delete: {

                    }
                }
            }

        }

        async get(){

            this.save = false
            this.result = await this.generateCodeImage()

            return this.result

        }

        async save(){

            this.save = true
            this.result = await this.generateCodeImage()

            return this.result

        }


        async delete(path) {

            if (typeof path == 'object'){ // if coming from an http POST
                path = path.path
            }

            if (!path.match(/^\//)){
                path = '/'+path
            }

            path = global.basedir+'/public'+path

            if (fs.existsSync(path)){
                try {
                    await fs.unlinkSync(path)
                    this.result = 'deleted'
                    return this
                } catch(err) {
                    this.err = 'Image not deleted'
                    return this
                }
            } else {
                this.err = 'Image does not exist'
                return this
            }

        }

        generateCodeImage() {

            if (!this.type){
                this.type = 'qrcode'
            }

            return new Promise(async (resolve, reject) => {

                bwipjs.toBuffer({
                    bcid:        this.type,       // Barcode type
                    text:        this.code,    // Text to encode
                    scale:       3,               // 3x scaling factor
                    height:      20,
                    width:       20,              // Bar height, in millimeters
                    includetext: true,            // Show human-readable text
                    textxalign:  'center',        // Always good to set this
                })
                .then(async (buffer) => {

                    let base64 = `data:image/png;base64,${buffer.toString('base64')}`

                    if (this.save){
                        img_url = await new Image(base64,'code-'+this.code,'codes').save()
                        return img_url
                    } else {
                        return base64
                    }

                })
                .catch(err => {
                    this.error = err
                    return this
                })

            })

        }

    }

    module.exports = Image
