const Models = require(basedir+'/modules/Models')

class Collections extends Models {

    constructor(data){

        super(data)

    }

    async getItems(key, query){

        this.data = await DB.read(this.settings.collection).where(['_key == '+key]).first()

        if (!this.data.items){
            this.data.items = []
            return this
        }

        let collection = this.settings.collection_of
        let items = this.data.items.map((item, i) => {

                if (i >= query.end){
                    return ''
                } else {
                    item = collection+'/'+item
                    return item
                }

            }).filter((item)=>{
                return item.length > 0
            })

        this.collection_data = await DB.read(this.settings.collection_of)
                            .whereMultiple(items)
                            .first()

        return this.collection_data

    }

}

module.exports = Collections
