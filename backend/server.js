import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import color from "colors";
import { sanitizeInput } from "./middlewares/sanitizeMiddleware.js";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import connectionRoutes from "./routes/connectionRoutes.js";
import Notification from "./Modals/notificationModel.js";
import { upsertMessageNotification } from "./utils/notificationUtils.js";
import { setIO } from "./utils/socketInstance.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { notFound, errorHandler } from "./middlewares/errorMiddleWare.js";
import { Server } from "socket.io";
import path from "path";
import http from "http";
// import {
//     logNewConnection,
//     logSetup,
//     logJoinChat,
//     logNewMessage,
//     logMessageDeleted,
//     logTyping,
//     logStopTyping,
// } from "./utils/socketDebugLogger.js";

// ==========================================================
// ENV + DB SETUP
// ==========================================================
dotenv.config(); // loads all secret keys from .env into process.env

const app = express();
app.set("trust proxy", 1);
connectDB();

// ==========================================================
// GLOBAL MIDDLEWARE
// ==========================================================
app.use(helmet({
    // no hand-tuned Content-Security-Policy for this app yet — leaving
    // helmet's default CSP on would risk breaking the CRA build's inline
    // scripts/styles. The rest of helmet's headers (X-Content-Type-Options,
    // X-Frame-Options, etc.) still apply.
    contentSecurityPolicy: false,
}));

// same-origin assumption as the socket.io CORS config below: in production
// this server also serves the React build itself, so there's no real
// cross-origin caller to allow. credentials:true is required for the
// refresh-token cookie to be sent/received at all.
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? false : "http://localhost:3000",
    credentials: true,
}));

app.use(cookieParser());
app.use(express.json()); // parse incoming requests with JSON payloads
app.use(sanitizeInput); // strip Mongo-operator-shaped keys ($gt, $where, ...) out of body/params/query

// generous global ceiling per IP — not meant to shape normal usage, just
// to blunt scraping/abuse; the auth routes have their own tighter limiter
app.use('/api', rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later." },
}));

// ==========================================================
// API ROUTES
// ==========================================================
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/connection', connectionRoutes);
app.use('/api/notification', notificationRoutes);

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

setIO(io); // NEW — lets controllers (connectionControllers, chatControllers) emit socket events too

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
    // socket.on('new message', (newMessageRecieved) => {
    //     // logNewMessage(newMessageRecieved); // debug: comment/uncomment to toggle

    //     var chat = newMessageRecieved.chat;

    //     chat.users.forEach(user => {
    //         // don't send the message back to the sender
    //         if (user._id.toString() === newMessageRecieved.sender._id.toString()) {
    //             return;
    //         }

    //         socket.in(user._id).emit("message recieved", newMessageRecieved);
    //     });
    // });
    socket.on('new message', async (newMessageRecieved) => {
        // logNewMessage(newMessageRecieved); // debug: comment/uncomment to toggle

        var chat = newMessageRecieved.chat;
        if (!chat.users) return console.log('chat.users not defined');

        for (const user of chat.users) {
            // don't send the message back to the sender
            if (user._id.toString() === newMessageRecieved.sender._id.toString()) continue;

            socket.in(user._id).emit("message recieved", newMessageRecieved);

            // NEW — persist + push a real-time notification for this user,
            // one row per chat with a running count (per our design)
            try {
                const notification = await upsertMessageNotification({
                    recipientId: user._id,
                    senderId: newMessageRecieved.sender._id,
                    chatId: chat._id,
                    contentPreview: newMessageRecieved.content,
                });

                const populatedNotification = await Notification.findById(notification._id)
                    .populate("sender", "name pic")
                    .populate("chat", "_id chatName isGroupChat");   // was: .populate("chat")
                    
                socket.in(user._id).emit("notification", populatedNotification);
            } catch (err) {
                console.log("Failed to create message notification", err);
            }
        }
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
