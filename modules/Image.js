
    const bwipjs = require('bwip-js')

    class Image {

        constructor(base64, file_name, file_path){

            this.base64 = base64
            this.file_name = file_name
            this.ext = base64.split(';')[0].split('/')[1]
            this.base64Data = base64.replace(/^data:image\/(png|jpg|jpeg);base64,/i, "")
            this.time = Date.now()+''
            this.dir1 = this.time.substr(0,3)
            this.dir2 = this.time.substr(3,1)
            this.path_check = global.basedir+'/public/images/'+file_path
            this.dir_check1 = global.basedir+'/public/images/'+file_path+'/'+this.dir1
            this.dir_check2 = this.dir_check1+'/'+this.dir2
            this.name = this.dir_check2+'/'+file_name+'-'+this.time+'.'+this.ext
            this.result = '/images/'+file_path+'/'+this.dir1+'/'+this.dir2+'/'+file_name+'-'+this.time+'.'+this.ext

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

            await fs.writeFile(this.name, this.base64Data, 'base64', function(err) {
                if (err){console.log(err)}
            })

            return this.result

        }

        async saveAll(obj, prefix, path) {

            for (let [key, value] of Object.entries(obj)) {
                if (typeof value == 'string' && value.match(/^data:image\//)){
                    obj[key] = await new Image(obj[key], prefix, path).save()
                }
            }
            return obj

        }

        delete(path) {

            if (!path.match(/^\//)){
                path = '/'+path
            }

            path = global.basedir+'/public'+path

            return new Promise(function(resolve, reject) {

                if (fs.existsSync(path)){
                    try {
                        fs.unlinkSync(path)
                        return this.result = 'deleted'
                    } catch(err) {
                        this.err = 'Image not deleted'
                        return this
                    }
                } else {
                    this.err = 'Image does not exist'
                    return this
                }

            })

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
