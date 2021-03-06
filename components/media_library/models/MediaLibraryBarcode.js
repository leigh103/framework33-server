
    const Files = require(basedir+'/modules/Files'),
          bwipjs = require('bwip-js')

    class MediaLibraryBarcode extends Files {

        constructor(data, type, name){

            super()

            if (!data){
                // this.error = "No data provided"
                // return this
                this.result
            } else {

                if (typeof data == 'object'){
                    this.code = data.code+''
                    this.type = data.type
                    this.name = data.name
                } else {
                    this.code = data+''
                    this.type = type
                    this.name = name
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
            this.time = Date.now()+''
            this.dir1 = this.time.substr(0,3)
            this.dir2 = this.time.substr(3,1)
            this.path = ['public','images','codes', this.dir1, this.dir2]

            if (this.name){
                this.file_name = this.name
            } else {
                this.file_name = ''
            }

            this.file_name = this.file_name+''+this.time+'.png'
            this.ext = 'png'
            this.file_type = 'base64'

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

            if (this.type == 'qrcode'){
                this.dimensions = {
                    width: 40,
                    height:40
                }
            } else if (this.type == 'ean13'){
                this.dimensions = {
                    width: 40,
                    height:20
                }
            } else if (this.code.length > 14){
                this.dimensions = {
                    width: 80,
                    height:20
                }
            } else {
                this.dimensions = {
                    width: 40,
                    height:20
                }
            }


            return new Promise(async (resolve, reject) => {

                bwipjs.toBuffer({
                    bcid:        this.type,       // Barcode type
                    text:        this.code,    // Text to encode
                    scale:       3,               // 3x scaling factor
                    height:      this.dimensions.height,
                    width:       this.dimensions.width,              // Bar height, in millimeters
                    includetext: true,            // Show human-readable text
                    textxalign:  'center',        // Always good to set this
                })
                .then(async (buffer) => {

                    this.file_data = buffer.toString('base64')

                    if (this.save){
                        await this.saveToDisk()
                        this.result = this.url
                    } else {
                        this.result = base64
                    }

                    resolve()

                })
                .catch(err => {
                    console.log(err)
                    this.error = JSON.stringify(err, Object.getOwnPropertyNames(err))
                //    this.error = this.error.split('\\n')[0].replace('{"stack":"','')
                    resolve()
                })

            })

        }

    }

    module.exports = MediaLibraryBarcode
