
    class WsClient {

        constructor(id, data){

            this.id = id
            this.data = data
            this.error = ''
            this.success = ''

        }

        save(){
            global.websocket_clients[this.id] = this.data
        }

        send(content){

            if (!global.websocket_clients[this.id]){
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
            global.websocket_clients[this.id].send(content)
            this.success = 'Message sent to client'
            return this

        }

    }

    module.exports = WsClient
