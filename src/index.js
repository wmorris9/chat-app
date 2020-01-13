const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const publicDirecotryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirecotryPath))

io.on('connection', (socket) => {
    console.log('New Web Socket Connection')

    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room })

        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('receiveMessage', generateMessage('Chat Room', 'Welcome!'))
        socket.broadcast.to(user.room).emit('receiveMessage', generateMessage('Chat Room',`${user.username} has joined the chat!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('receiveMessage', generateMessage(user.username, message))
        callback('Delivered.') 
    })

    socket.on('sendLocation', (location, callback) => {
        const user = getUser(socket.id)
        locationLink = `https://google.com/maps?q=${location.latitude},${location.longitude}`
        io.to(user.room).emit('receiveLocation', generateLocationMessage(user.username, locationLink))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('receiveMessage', generateMessage('Chat Room', `${user.username} has left the chat.`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(process.env.PORT || 3000, () => {
    console.log(`Listening on port ${process.env.PORT || 3000}`)
})  