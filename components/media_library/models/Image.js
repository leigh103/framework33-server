
    const bwipjs = require('bwip-js'),
          sharp = require('sharp')

    class Image {

        constructor(base64, file_name, file_path){

            if (!base64){
                // this.error = "No data provided"
                // return this
                this.result
            } else {

                if (typeof base64 == 'object'){
                    file_name = base64.file_name
                    file_path = base64.file_path
                    base64 = base64.base64
                }

                this.base64 = base64
                this.file_name = file_name
                this.ext = base64.match(/^data:image\/(png|jpg|jpeg|svg\+xml);base64,/i)[1]

                if (this.ext == 'svg+xml'){
                    this.ext = 'svg'
                }

                if (this.ext == 'jpeg'){
                    this.ext = 'jpg'
                }

                this.base64Data = base64.replace(/^data:image\/(png|jpg|jpeg|svg\+xml);base64,/i, "")
                this.time = Date.now()+''
                this.dir1 = this.time.substr(0,3)
                this.dir2 = this.time.substr(3,1)
                this.path_check = global.basedir+'/public/images/'+file_path
                this.dir_check1 = global.basedir+'/public/images/'+file_path+'/'+this.dir1
                this.dir_check2 = this.dir_check1+'/'+this.dir2
                this.name = this.dir_check2+'/'+file_name+'-'+this.time+'.'+this.ext
                this.result = '/images/'+file_path+'/'+this.dir1+'/'+this.dir2+'/'+file_name+'-'+this.time+'.'+this.ext

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

        async save(){

            if (!fs.existsSync(this.path_check)){
                await fs.mkdirSync(this.path_check);
            }

            if (!fs.existsSync(this.dir_check1)){
                await fs.mkdirSync(this.dir_check1);
            }

            if (!fs.existsSync(this.dir_check2)){
                await fs.mkdirSync(this.dir_check2);
            }

            await fs.writeFile(this.name, this.base64Data, 'base64', async (err) => {

                let imgpath = this.name
                if (this.ext == 'jpg'){
                    let sharp_img = await sharp(imgpath)
                    if ((await sharp_img.metadata()).width > 3000) {
                        console.log('resizing')
                        await sharp_img
                            .rotate()
                            .resize({ width: 1500, height: 1500, fit: 'cover' })
                            .toBuffer(function(err, buffer) {
                                fs.writeFile(imgpath, buffer, function(e) {
                                })
                            })
                        }

                }

            })

            let ml_payload = {
                name:this.file_name,
                url:this.result,
                full_path:this.name,
                type:'image',
                file_type:this.ext,
                full_size: this.result,
                medium:'/media/500/80'+this.result,
                thumbnail:'/media/300/60'+this.result
            }

            await DB.create('media_library',ml_payload)

            return ml_payload
        }

        async saveAll(obj, prefix, path) {

            for (let [key, value] of Object.entries(obj)) {
                if (typeof value == 'string' && value.match(/^data:image\//)){
                    obj[key] = await new Image(obj[key], prefix, path).save()
                }
            }
            return obj

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

        generateBarcode(code, type, save) {

            if (!type){
                type = 'qrcode'
            }

            return new Promise(async (resolve, reject) => {

                bwipjs.toBuffer({
                    bcid:        type,       // Barcode type
                    text:        code,    // Text to encode
                    scale:       3,               // 3x scaling factor
                    height:      20,
                    width:       20,              // Bar height, in millimeters
                    includetext: true,            // Show human-readable text
                    textxalign:  'center',        // Always good to set this
                })
                .then(async (buffer) => {
                    let base64 = `data:image/png;base64,${buffer.toString('base64')}`

                    if (save){
                        img_url = await new Image(base64,'barcode-'+code,'barcodes').save()
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
