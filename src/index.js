//load in express library
const express = require("express");

//load in http core module
const http = require("http");

//load in path module from node
const path = require("path");

//load socketio
const socketio = require("socket.io");

//load bad words package
var Filter = require("bad-words");

//load messages.js
const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");

//load users.js
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");

//create application
const app = express();

//create new web server for our app application
const server = http.createServer(app);

//create a new instane of socket.io to configure websockets to work with our server (server)
const io = socketio(server);

//port
const port = process.env.PORT || 3000;

//get public path
const publicDir = path.join(__dirname, "../public");

//serve static file
app.use(express.static(publicDir));

//server will send this to all connected clients when it's updated
// let count = 0;

// server(emit) -> client(receive) - countUpdated
// client(emit) -> server(receive) - increment

//print message to the terminal when a client connects (event : connection)
// io.on("connection", (socket) => {
//   console.log("new web socket connection");

//   //custom event that server sends to client the first argument is the custom name of the event the second argument is what is being sent to the client
//   socket.emit("countUpdated", count);

//   //listen to event that the client sent
//   socket.on("increment", () => {
//     count++;
//     //send it back to client the updated count
//     //send to specific connection
//     //socket.emit('countUpdated', count)
//     //send to all connections
//     io.emit("countUpdated", count);
//   });
// });

//print message to the terminal when a client connects (event : connection)
io.on("connection", (socket) => {
  console.log("new web socket connection");

  //custom event that server sends to client the first argument is the custom name of the event the second argument is what is being sent to the client
  // socket.emit("message", generateMessage('Welcome'));

  //emit to everybody but the current connection
  // socket.broadcast.emit("message", generateMessage("A new user has joined"));

  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);

    socket.emit("message", generateMessage("Admin", "Welcome"));
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        generateMessage("Admin", `${user.username} has joined the room!`)
      );

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();

    //io.to.emit emits to everyone in a specific room
    //socket.broadcast.to.emit emits to everyon in a specific room except itself
  });

  //callback is the event acknowledgement from the client
  socket.on("sendMessage", (msg, callback) => {
    const user = getUser(socket.id);
    const filter = new Filter();

    if (filter.isProfane(msg)) {
      return callback("Profanity is not allowed");
    }

    io.to(user.room).emit("message", generateMessage(user.username, msg));
    callback();
  });

  //runs when a client gets disconnected
  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage("Admin", `${user.username} has left the room`)
      );
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
  });

  //runs when client send location
  socket.on("sendLocation", (data, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${data.lat},${data.long}`
      )
    );
    callback();
  });
});

//listen to port
// app.listen(port, ()=>{
//     console.log(`server is up on port ${port}`)
// });

// ^ replace app.listen with server.listen to start up the http server
server.listen(port, () => {
  console.log(`server is up on port ${port}`);
});
