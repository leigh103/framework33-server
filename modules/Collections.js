const Models = require(basedir+'/modules/Models')

class Collections extends Models {

    constructor(data){

        super(data)

    }

    async getItems(key){

        this.data = await DB.read(this.settings.collection).where(['_key == '+key]).first()

        let collection = this.settings.collection_of
        let items = this.data.items.map((item) => {
                item = collection+'/'+item
                return item
            })

        this.collection_data = await DB.read(this.settings.collection_of)
                            .whereMultiple(items)
                            .first()

        return this.collection_data

    }

}

module.exports = Collections
