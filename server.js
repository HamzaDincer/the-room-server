//Loading dependencies & initializing express
const app = require('express')(); 
const http = require('http');//for creating http server
const { v4: uuidv4 } = require('uuid');
const cors = require("cors");
const server = http.createServer(app);
const { Server } = require("socket.io");

const rooms = {};

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

        // socket.on('caption', (roomId, userId, caption) => {
        //   io.to(roomId).emit('caption-update', userId, caption);
        // });

        // make socket join the room with the roomID
        socket.join(roomId)  ;

        // broadcast everyone except the user itself that the user is connected
        socket.broadcast.emit('user-connected', userId) ;

        // Log that a user connected to a room
        console.log("User ("+userId+") connected to room (" + roomId + ")" ) ;


        // Listen for chat messages from this socket
        socket.on('chat-message', ({ message, name }) => {
          // Broadcast the message to all other sockets in the room
          socket.broadcast.to(roomId).emit('chat-message', { name, message });
          console.log(`Received chat message: ${message} from ${name}`);
        });

        socket.on('caption-message', (data) => {
          // Broadcast the message to all connected clients
          socket.broadcast.emit('caption-message', data.message);
        });
        // When the socket disconnects (ie. close the window)
        socket.on('disconnect', () => {
            console.log("User ("+userId+") disconnected from room (" + roomId + ")" ) ;
            socket.broadcast.emit('user-disconnected', userId)
        });

        
    }) ;

    socket.on("create-room", ({ roomName, userName }) => {
      // Check if the room already exists
      if (rooms[roomName]) {
        socket.emit("create-room-error", "Room already exists");
        return;
      }
  
      // Create a new room and add the user as the owner
      rooms[roomName] = {
        owner: userName,
        participants: [socket.id],
      };
  
      // Join the room and let the user know they were successful
      socket.join(roomName);
      socket.emit("create-room-success", roomName);
  
      console.log(`Room ${roomName} created by ${userName}`);
      console.log(rooms);
    })

});

const srv = server.listen(8000 , ()=>{
    console.log("Server running on port 8000");
})

app.use('/peerjs', require('peer').ExpressPeerServer(srv, {
	debug: true
}))