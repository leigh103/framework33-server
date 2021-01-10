
    class WsClient {

        constructor(id, data){

            this.id = id
            this.data = data
            this.error = ''
            this.success = ''

        }

        save(){
            global.websocket.clients[this.id] = this.data
        }

        get(){

            return new Promise((resolve, reject) => {

                if (typeof global.websocket.clients == 'object' && global.websocket.clients[this.id]){
                    resolve(global.websocket.clients[this.id])
                } else {
                    reject()
                }

            })

        }

        store(){
            global.websocket.data[this.id] = this.data
        }

        getData(){

            return new Promise((resolve, reject) => {

                if (global.websocket.data[this.id]){
                    resolve(global.websocket.data[this.id])
                } else {
                    reject()
                }

            })

        }

        send(content){

            if (!global.websocket.clients[this.id]){
                this.error = 'Client not connected'
                return this
            }

            if (!content){
                this.error = 'Nothing to send'
                return this
            }

            if (typeof content == 'object'){
                content = JSON.stringify(content)
            }
            global.websocket.clients[this.id].send(content)
            this.success = 'Message sent to client'
            return this

        }

        adminBroadcast(content){

            if (!content){
                this.error = 'Nothing to send'
                return this
            }

            if (typeof content == 'object'){
                content = JSON.stringify(content)
            }

            for (var client in global.websocket.clients){
                global.websocket.clients[client].send(content)
            }

            this.success = 'Done'
            return this

        }

    }

    module.exports = WsClient
