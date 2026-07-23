import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import color from "colors";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import connectionRoutes from "./routes/connectionRoutes.js";
import { notFound, errorHandler } from "./middlewares/errorMiddleWare.js";
import { Server } from "socket.io";
import path from "path";
import http from "http";
import {
    logNewConnection,
    logSetup,
    logJoinChat,
    logNewMessage,
    logMessageDeleted,
    logTyping,
    logStopTyping,
} from "./utils/socketDebugLogger.js";

// ==========================================================
// ENV + DB SETUP
// ==========================================================
dotenv.config(); // loads all secret keys from .env into process.env

const app = express();
connectDB();

// ==========================================================
// GLOBAL MIDDLEWARE
// ==========================================================
app.use(express.json()); // parse incoming requests with JSON payloads

// ==========================================================
// API ROUTES
// ==========================================================
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/connection', connectionRoutes);

// ==========================================================
// DEPLOYMENT SETUP (serve React build in production)
// ==========================================================
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

// ==========================================================
// ERROR HANDLING MIDDLEWARE (must come after routes)
// ==========================================================
app.use(notFound);
app.use(errorHandler);

// ==========================================================
// HTTP + SOCKET.IO SERVER SETUP
// ==========================================================
const server = http.createServer(app);
server.listen(process.env.PORT, console.log(`Server is running on port ${process.env.PORT}`.green.bold));

const io = new Server(server, {
    pingTimeout: 60000,
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? false
            : "http://localhost:3000",
    },
    transports: ['websocket', 'polling'],
});

// ==========================================================
// SOCKET.IO EVENT HANDLERS
// ==========================================================
io.on("connection", (socket) => {
    // logNewConnection(socket); // debug: comment/uncomment to toggle

    // As soon as a user logs in, join a room named after their own user id.
    // That room is exclusive to this user, so we can target them directly later.
    socket.on('setup', (userData) => {
        // logSetup(socket, userData); // debug: comment/uncomment to toggle

        socket.join(userData._id);
        socket.emit("connected");
    });

    // join a specific chat's room
    socket.on("join chat", (room) => {
        // logJoinChat(socket, room); // debug: comment/uncomment to toggle

        socket.join(room);
    });

    // broadcast a new message to every other member of the chat
    socket.on('new message', (newMessageRecieved) => {
        // logNewMessage(newMessageRecieved); // debug: comment/uncomment to toggle

        var chat = newMessageRecieved.chat;

        chat.users.forEach(user => {
            // don't send the message back to the sender
            if (user._id.toString() === newMessageRecieved.sender._id.toString()) {
                return;
            }

            socket.in(user._id).emit("message recieved", newMessageRecieved);
        });
    });

    // broadcast a message deletion to every other member of the chat
    socket.on("message deleted", (updatedMessage) => {
        // logMessageDeleted(updatedMessage); // debug: comment/uncomment to toggle

        var chat = updatedMessage.chat;
        if (!chat.users) return console.log('chat.users not defined');

        chat.users.forEach(user => {
            if (user._id == updatedMessage.sender._id) return;
            socket.in(user._id).emit("message deleted", updatedMessage);
        });
    });

    // typing indicators
    socket.on("typing", (room) => {
        // logTyping(socket, room); // debug: comment/uncomment to toggle

        socket.in(room).emit("typing");
    });

    socket.on("stop typing", (room) => {
        // logStopTyping(room); // debug: comment/uncomment to toggle

        socket.in(room).emit("stop typing");
    });

    socket.off("setup", () => {
        socket.leave(userData._id);
    });
});
