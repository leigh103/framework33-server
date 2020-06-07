
    const cookie = require('cookie')

    var ws_client = {
        broadcast:(data, room) => {

            return new Promise(function(resolve, reject) {

                Object.keys(ws_clients).forEach(function each(client,i) {

                    if (room && ws_clients[client].room == room){
                        if (ws_clients[client].readyState && ws_clients[client].readyState === WebSocket.OPEN) {
                            ws_clients[client].send(JSON.stringify(data));
                        }
                    } else if (ws_clients[client].readyState && ws_clients[client].readyState === WebSocket.OPEN) {
                        ws_clients[client].send(JSON.stringify(data));
                    }

                    if (i >= Object.keys(ws_clients).length-1){
                        resolve('ok')
                    }

                });

            })


        },
        emit:(client, data, delay) => {

            return new Promise(function(resolve, reject) {

                payload = JSON.stringify({data:data})

                if (typeof client == 'object'){

                    let client_id = ws_client.findID(client)

                    ws_client.send(client_id, payload).then((result)=>{
                        resolve(result)
                    }).catch((err)=>{
                        reject(err)
                    })
                } else {
                    ws_client.send(client, payload).then((result)=>{
                        resolve(result)
                    }).catch((err)=>{
                        reject(err)
                    })
                }

            })

        },

        send:(client_id,payload)=>{

            return new Promise(function(resolve, reject) {
                if (ws_clients['wsc_'+client_id]){

                    ws_clients['wsc_'+client_id].send(payload)
                    resolve(ws_clients['wsc_'+client_id])

                } else {
                    reject('Client not found')
                }
            })

        },

        listRooms:() => {

            return new Promise(function(resolve, reject) {
                localStorage.get('rooms').then((rooms)=>{
                    resolve(rooms)
                })
            }).catch(()=>{
                reject('No rooms available')
            })

        },

        createRoom:(room_name) => {

            return new Promise(function(resolve, reject) {
                localStorage.get('rooms').then((rooms)=>{

                    let room = rooms.find((item)=>{
                        return item.name && item.name == room_name
                    })

                    if (!room){
                        rooms.push({name:room_name.replace(/\s/g,'_'),clients:[]})
                        localStorage.set('rooms',rooms)
                    }

                    resolve(rooms)
                }).catch(()=>{
                    let rooms = []
                    rooms.push = {name:room_name.replace(/\s/g,'_'),clients:[]}
                    localStorage.set('rooms',rooms)
                    resolve(rooms)
                })
            })

        },

        deleteRoom:(room_name) => {

            return new Promise(function(resolve, reject) {

                localStorage.get('rooms').then((rooms)=>{

                    let room = rooms.findIndex((item)=>{
                        return item.name && item.name == room_name
                    })

                    if (room >= 0){

                        ws_client.emptyRoom(rooms[room])

                        rooms.splice(room,1)
                        localStorage.set('rooms',rooms)

                    }

                    resolve(rooms)

                })

            })

        },

        emptyRoom:(room)=>{

            return new Promise(function(resolve, reject) {
                room.clients.forEach((item)=>{
                    if (ws_clients['wsc_'+item]){
                        ws_clients['wsc_'+item].room = ''
                    }
                })
            })

        },

        joinRoom:(client, room_name)=>{

            return new Promise(function(resolve, reject) {

                localStorage.get('rooms').then((rooms)=>{

                    let room = rooms.findIndex((item)=>{
                        return item.name == room_name
                    })

                    if (room>=0){

                        let client_id = ws_client.findID(client)

                        if (!rooms[room].clients){
                            rooms[room].clients = []
                        }
                        rooms[room].clients.push(client_id)

                        ws_clients['wsc_'+client_id].room = room_name

                        resolve(rooms[room])

                    } else {
                        reject('Room not available')
                    }

                }).catch(()=>{
                    reject('No rooms available')
                })

            })

        },

        leaveRoom:(client, room_name)=>{

            return new Promise(function(resolve, reject) {

                localStorage.get('rooms').then((rooms)=>{

                    let room = rooms.findIndex((item)=>{
                        return item.name == room_name
                    })

                    if (room>=0){

                        let client_id = ws_client.findID(client)

                        if (rooms[room].clients){
                            rooms[room].clients.splice(rooms[room].clients.indexOf(client_id),1)
                        }

                        ws_clients['wsc_'+client_id].room = ''

                        resolve(rooms[room])

                    } else {
                        reject('Room not available')
                    }

                }).catch(()=>{
                    reject('No rooms available')
                })

            })

        },

        findID:(client)=>{

            let cookies = cookie.parse(client.headers.cookie),
                client_id = cookieParser.signedCookie(cookies["connect.sid"],config.websocket.secret)

            return client_id

        }

    }

    module.exports = ws_client
