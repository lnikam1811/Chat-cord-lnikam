const path = require("path")
const http = require("http")
const express = require("express")
const socketio = require("socket.io")
const formatMessage = require("./utils/messages")
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users")

const app = express()
const server = http.createServer(app)
const io = socketio(server)

//Set static folder

app.use(express.static(path.join(__dirname, "PUBLIC")))

const botName = "ChatCord bot"

// Run when client is connected

io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room)

    socket.join(user.room)

    //Welcome when user connect
    socket.emit("message", formatMessage(botName, "Welcome to ChatCord"))

    //Broadcast when user connection
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      )

    //send user and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    })
  })

  //Catch chat message
  socket.on("chatMsg", (chatMsg) => {
    const user = getCurrentUser(socket.id)
    io.to(user.room).emit("message", formatMessage(user.username, chatMsg))
  })

  //Broadcast when user disconnect
  socket.on("disconnect", () => {
    const user = userLeave(socket.id)

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      )

      //send user and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      })
    }
  })
})

const PORT = 3000 || process.env.PORT

server.listen(PORT, () => console.log(`Server running on port ${PORT}`))
