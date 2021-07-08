
    const Files = require(basedir+'/modules/Files'),
          sharp = require('sharp')

    class Image extends Files {

        constructor(base64, file_name, file_path, tags){

            super()

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

                file_name = file_name.replace(/\s+/,'_').replace(/[";\\/|+=')(*&^%$£@!.,><?`~]+/,'')

                this.base64 = base64
                this.file_name = file_name
                this.ext = base64.match(/^data:image\/(png|jpg|jpeg|svg\+xml);base64,/i)[1]

                if (this.ext == 'svg+xml'){
                    this.ext = 'svg'
                }

                if (this.ext == 'jpeg'){
                    this.ext = 'jpg'
                }

                this.time = Date.now()+''

                this.file_data = base64.replace(/^data:image\/(png|jpg|jpeg|svg\+xml);base64,/i, "")
                this.file_name = file_name+'-'+this.time+'.'+this.ext
                this.file_type = 'base64'

                this.dir1 = this.time.substr(0,3)
                this.dir2 = this.time.substr(3,1)

                this.path = ['public','images', file_path, this.dir1, this.dir2]
                this.compression = 80

                this.result = '/images/'+file_path+'/'+this.dir1+'/'+this.dir2+'/'+file_name+'-'+this.time+'.'+this.ext

                if (tags){
                    this.tags = tags
                } else {
                    this.tags = ''
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
                        preDelete:['admin']
                    },
                    put: {
                        save:['admin']
                    },
                    preDelete: {

                    }
                }
            }

        }

        resize(width, height, fit){

            if (!width){
                return this
            }

            if (!height){
                height = width
            }

            if (!fit){
                fit = 'cover'
            }

            this.file_resize = {
                width: width,
                height: height,
                fit: fit
            }
            return this

        }

        compression(level){

            if (!level){
                this.compression = 80
            } else {
                this.compression = level
            }
            return this
        }

        async save(){

            try {
                await this.saveToDisk()
                await this.getFileStats()
            }
            catch(err){
                log(err)
                this.error = err
                return this
            }

            await this.process()

            let ml_payload = {
                name: this.file_name,
                url: this.url,
                full_path: this.full_path,
                file_path: this.file_path,
                type:'image',
                file_type: this.ext,
                file_stats: this.file_stats,
                tags: this.tags
            }

            if (this.ext == 'svg'){
                ml_payload.medium = this.url,
                ml_payload.thumbnail = this.url
            } else {
                ml_payload.medium = '/media/500/80'+this.url,
                ml_payload.thumbnail = '/media/300/60'+this.url
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

        async process(){

            return new Promise( async (resolve, reject) => {

                let sharp_img = await sharp(this.full_path),
                    full_path = this.full_path,
                    self = this,
                    resize = { width: 1500, height: 1500, fit: 'cover' }

                if (this.file_resize){
                    resize = this.file_resize
                }

                if (this.ext == 'jpg'){

                    if ((await sharp_img.metadata()).width > 2000 || typeof this.file_resize == 'object') {
                        await sharp_img
                            .rotate()
                            .resize(resize)
                            .jpeg({quality: this.compression})
                            .toBuffer( async (err, buffer) => {
                                this.file_data = buffer
                                await self.saveToDisk()
                            })
                    } else if (this.file_stats.size >= 1000000){
                        await sharp_img
                            .rotate()
                            .jpeg({quality: quality})
                            .toBuffer( async (err, buffer) => {
                                this.file_data = buffer
                                await self.saveToDisk()
                            })
                    }

                }

                if (this.ext == 'png'){

                    if ((await sharp_img.metadata()).width > 2000 || typeof this.file_resize == 'object') {
                        await sharp_img
                            .rotate()
                            .resize(resize)
                            .png({ compressionLevel: 9,
                                adaptiveFiltering: true,
                                force: true,
                                quality: this.compression })
                            .toBuffer( async (err, buffer) => {
                                this.file_data = buffer
                                await self.saveToDisk()
                            })
                    } else if (this.file_stats.size >= 1000000){
                        await sharp_img
                            .rotate()
                            .png({ compressionLevel: 9,
                                adaptiveFiltering: true,
                                force: true,
                                quality: this.compression })
                            .toBuffer( async (err, buffer) => {
                                this.file_data = buffer
                                await self.saveToDisk()
                            })
                    }

                }

                resolve()

            })

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
