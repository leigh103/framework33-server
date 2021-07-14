

    class Files {

        constructor(data){

            this.file_stats = []

        }

        async saveToDisk(){

            this.file_path = await this.checkPath()
            this.full_path = this.file_path+'/'+this.file_name

            if (this.path[0] == 'public'){
                this.url = this.path.join('/')+'/'+this.file_name
                this.url = this.url.replace(/^public/,'')
            }

            return new Promise( async (resolve, reject) => {

                await fs.writeFile(this.full_path, this.file_data, this.file_type, async (err) => {

                    if (err){
                        reject(err)
                    } else {
                        console.log('saved')
                        await this.getFileStats()
                        resolve(this.full_path)
                    }

                })


            })

        }

        async checkPath(){

            return new Promise( async (resolve, reject) => {

                let full_path = global.basedir

                for (let path of this.path){

                    full_path += '/'+path
                    await this.makeDirectory(full_path)


                }
                resolve(full_path)

            })
            // if (!fs.existsSync(this.path_check)){
            //     await fs.mkdirSync(this.path_check);
            // }
            //
            // if (!fs.existsSync(this.dir_check1)){
            //     await fs.mkdirSync(this.dir_check1);
            // }
            //
            // if (!fs.existsSync(this.dir_check2)){
            //     await fs.mkdirSync(this.dir_check2);
            // }
        }

        async makeDirectory(path){

            return new Promise( async (resolve, reject) => {

                if (!fs.existsSync(path)){
                    fs.mkdir(path, (err)=>{

                        if (err){
                            reject(err)
                        } else {
                            resolve()
                        }

                    });
                } else {
                    resolve()
                }

            })

        }

        async getFileSize(unit){

            if (!this.file_stats){
                await this.getFileStats()
            }

            if (!unit){
                return this.file_stats.size
            } else {
                return this.file_stats.size
            }

        }

        async getFileStats(){

            if (!this.full_path){
                return
            }

            this.file_stats = fs.statSync(this.full_path)

        }

    }

    module.exports = Files
