import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import color from "colors";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import { notFound, errorHandler } from "./middlewares/errorMiddleWare.js";
import { Socket } from "socket.io";
import { Server } from "socket.io";
import path from "path";

import http from "http";

dotenv.config();

// this line loads all the secret key from the .env to process.env so that we can use it here in express server
const app = express();
connectDB();

// to tell the server that we are expecting json data in the body of the request
app.use(express.json());

// enpoint for users
// all the routes related to user would be in this file
app.use('/api/user',userRoutes);

// api endpoint for chats
app.use('/api/chat',chatRoutes);

// api  endpoint for messages
app.use('/api/message',messageRoutes);


// ------------------ DEPLOYMENT SETUP ------------------
const __dirname1 = path.resolve();

if (process.env.NODE_ENV === 'production') {
    // Serve static files from React build
    app.use(express.static(path.join(__dirname1, "/frontend/build")));

    // Handle all non-API routes
    app.get(/^(?!\/api).+/, (req, res) => {
        res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"));
    });

    // Also handle root path
    app.get('/', (req, res) => {
        res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"));
    });
} else {
    app.get("/", (req, res) => {
        res.send("API is Running Successfully");
    });
}


// error hadling middlewares
app.use(notFound);
app.use(errorHandler);

// const server = app.listen(process.env.PORT, console.log(`Server is running on port ${process.env.PORT}`.green.bold));

const server = http.createServer(app);
server.listen(process.env.PORT, console.log(`Server is running on port ${process.env.PORT}`.green.bold));

// const io = require('socket.io')(server,{
const io = new Server(server, {
    pingTimeout:60000,
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? false
            : "http://localhost:3000",
    },
    transports: ['websocket', 'polling'],
})

io.on("connection",(socket) => {
    console.log('connected to socket.io');

    // as soon as a user logins, we will make a new room for that particular user with the id of that user, and that means this user has joined this particular room and this room will be exclusive to this particular user oonly

    socket.on('setup',(userData) =>{
        socket.join(userData._id);
        // console.log(userData._id);
        socket.emit("connected");
    })

    // socket for joining a chat
    socket.on('join chat',(room) => {
        socket.join(room);
        console.log("User Joined Room: "+room);
    });


    // socket for send message
    socket.on('new message',(newMessageRecieved)=>{
        var chat = newMessageRecieved.chat;

        // if there is no user in that chat then
        if(!chat.users) return console.log('chat.users not defined');

        // now if that chat have the users and we are sending the message to it so then i want ki ye message mere alawa sabke pass chala jaye, single chat me bhi yhi logic hai ki i dont want wo message wapis mere pass aaye

        chat.users.forEach(user => {
            if(user._id == newMessageRecieved.sender.id) return;

            // otherwise sent or emit this message
            // means in this user._id room we are sending this particular newMessageRecived
            socket.in(user._id).emit("message recieved",newMessageRecieved);
        });

    })

    // socket for typing indicator
    socket.on("typing",(room)=> socket.in(room).emit("typing"));
    socket.on("stop typing",(room)=> socket.in(room).emit("stop typing"));

    socket.off("setup",()=>{
        console.log("USER DISCONNECTED");
        socket.leave(userData._id);
    });
});
