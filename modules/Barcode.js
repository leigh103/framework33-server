
    const bwipjs = require('bwip-js')

    class Barcode {

        constructor(data, type){

            if (!data){
                // this.error = "No data provided"
                // return this
                this.result
            } else {

                if (typeof data == 'object'){
                    this.code = data.code
                    this.type = data.type
                } else {
                    this.code = data
                    this.type = type
                }

                this.result

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
            await this.generateCodeImage()

            if (!this.result && !this.error){
                this.error = 'Code not generated, please try again'
            }

            if (this.error){
                return this
            } else {
                return this.result
            }

        }

        async save(){

            this.save = true
            await this.generateCodeImage()

            if (!this.result && !this.error){
                this.error = 'Code not generated, please try again'
            }

            if (this.error){
                return this
            } else {
                return this.result
            }


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
                    width:       40,              // Bar height, in millimeters
                    includetext: true,            // Show human-readable text
                    textxalign:  'center',        // Always good to set this
                })
                .then(async (buffer) => {

                    let base64 = `data:image/png;base64,${buffer.toString('base64')}`,
                        output

                    if (this.save){
                        this.result = await new Image(base64,'code-'+this.code,'codes').save()
                    } else {
                        this.result = base64
                    }

                    resolve()

                })
                .catch(err => {
                    this.error = JSON.stringify(err, Object.getOwnPropertyNames(err))
                //    this.error = this.error.split('\\n')[0].replace('{"stack":"','')
                    resolve()
                })

            })

        }

    }

    module.exports = Barcode
