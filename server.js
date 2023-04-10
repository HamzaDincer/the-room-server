//Loading dependencies & initializing express
const app = require('express')(); 
const http = require('http');//for creating http server
const { v4: uuidv4 } = require('uuid');
const cors = require("cors");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// When there is an incoming socket connection from a client
io.on('connection', socket => {
    console.log(`User with socket id ${socket.id} has connected`);

    // When receive message from 'join-room' channel in the socket.
    socket.on('join-room', (roomId, userId) => {

        // When a new room is created
        socket.emit('room-created', roomId);

        // make socket join the room with the roomID
        socket.join(roomId)  ;

        // broadcast everyone except the user itself that the user is connected
        socket.broadcast.to(roomId).emit('user-connected', userId) ;

        // Log that a user connected to a room
        console.log("User ("+userId+") connected to room (" + roomId + ")" ) ;

        // When the socket disconnects (ie. close the window)
        socket.on('disconnect', () => {
            console.log("User ("+userId+") disconnected from room (" + roomId + ")" ) ;
            socket.broadcast.to(roomId).emit('user-disconnected', userId)
        });
        
    }) ;

});

const srv = server.listen(8000 , ()=>{
    console.log("Server running on port 8000");
})

app.use('/peerjs', require('peer').ExpressPeerServer(srv, {
	debug: true
}))