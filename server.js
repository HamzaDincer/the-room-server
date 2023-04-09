//Loading dependencies & initializing express
var os = require('os'); //for operating system-related utility methods and properties
var express = require('express'); 
var app = express();
const path = require('path');
var http = require('http');//for creating http server
const {v4: uuidV4} = require('uuid');

//For signalling in WebRTC
var socketIO = require('socket.io');


app.set('view engine', 'ejs'); // Tell Express we are using EJS
app.use(express.static('public')); //Define the folder which contains the CSS and JS for the fontend

//Define a route 
app.get("/", function(req, res){
    //Render a view (located in the directory views/) on this route
    res.redirect(`/${uuidV4()}`)
});

// If they join a specific room, then render that room
app.get('/:room', (req, res) => {
    res.render('room', {roomId: req.params.room})
});


//Initialize http server and associate it with express
var server = http.createServer(app);


//Initialize socket.io
var io = socketIO(server);

// When there is an incoming socket connection from a client
io.on('connection', socket => {

    // When receive message from 'join-room' channel in the socket.
    socket.on('join-room', (roomId, userId) => {

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


var srv = server.listen(8000 , ()=>{
    console.log("Server running on port 8000");
})

app.use('/peerjs', require('peer').ExpressPeerServer(srv, {
	debug: true
}))