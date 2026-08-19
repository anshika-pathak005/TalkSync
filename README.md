# TalkSync - Real-Time Chat & Collaboration Platform

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-19.2.0-blue.svg)](https://reactjs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8.3-black.svg)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%209.0-green.svg)](https://www.mongodb.com/)

---

### Live Demo
> **Live Demo Link:** [Live Demo](https://talksync-21ho.onrender.com/)  

---

## 1. Project Title
**TalkSync** – A modern, secure, full-stack real-time chat and social connection platform built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.io.

---

## 2. Introduction
**TalkSync** is designed to provide seamless real-time messaging, interactive group dynamics, friend connections, and instant notifications. Built with performance, security, and aesthetics in mind, TalkSync features a sleek, responsive UI powered by **Chakra UI** and **Tailwind CSS**, smooth animations via **Framer Motion** and **Lottie**, and a robust dual-token security backend (JWT Access + HttpOnly Refresh Token).

Whether communicating 1-on-1 with friends, managing group conversations with admin privileges, sending connection requests, or deleting individual messages, TalkSync provides a production-grade messaging experience.

---

## 3. Features
*(Comprehensive feature list based on git history & codebase evolution)*

* **Authentication & Dual-Token Authorization:**
  * User Registration & Login with password validation.
  * Short-lived JWT Access Tokens (15-min) paired with secure HttpOnly Refresh Cookies (30-day).
  * Server-side `tokenVersion` tracking for instant global token invalidation on logout or password update.
* **Friend Request & Connections System (`commit 93f0ca7`):**
  * Search registered users by name or email.
  * Send, Accept, Reject, and Cancel connection/friend requests.
  * Remove connections (unfriend capability) with status tracking (`pending`, `accepted`, `rejected`, `removed`).
  * Dedicated Connections page showing active friends, pending inbound requests, and sent outbound requests.
* **Real-Time Messaging & Socket.io WebSockets (`commit 0a95189`, `1c515dc`, `53d4ce6`):**
  * Instant message delivery across active socket rooms.
  * Animated real-time typing indicators powered by React Lottie (`commit 185b439`).
  * Dedicated user socket rooms for targeted notifications and updates.
* **Group Chat Management (`commit 2c28637`, `33a27d5`, `399cdde`):**
  * Create custom group chats with multiple users.
  * Rename group chats dynamically.
  * Add or remove group members (restricted to group admins).
  * System event badges for group changes (e.g., user added/removed/left).
  * Leave group functionality.
* **Message Deletion Options (`commit 0fa3b34`):**
  * **Delete for Me:** Hides selected messages for the current user using server-side `deletedFor` array tracking.
  * **Delete for Everyone:** Overwrites message content permanently server-side with a placeholder visible to all participants.
* **Chat Deletion & Reopening (`commit c945678`, `d287337`, `cc1ac6f`):**
  * Hide/Delete chat for a single user with timestamped `deletedAt` filtering.
  * Automatic background cleanup of orphaned/unreachable chat messages.
  * Ability to manually reopen deleted chats without losing prior permanent deletion history filters.
* **Real-Time Notification System (`commit 38079e1`):**
  * Real-time unread message notifications aggregated per chat.
  * Notifications for connection requests and group additions.
  * MongoDB auto-expiring index (TTL) to automatically clean up unread notifications after 10 days.
* **User Profile & Security Settings (`commit 929369b`, `db1298e`):**
  * Profile avatar customization.
  * Secure password change modal requiring verification of the existing password.
* **Hardened Security Architecture (`commit 4c5471d`):**
  * Custom NoSQL Injection sanitizer (`sanitizeInput`) stripping dangerous MongoDB operators (`$gt`, `$where`, `$ne`) in Express 5 compatibility mode.
  * Rate limiting (`express-rate-limit`) on global API routes and strict rate limits on authentication endpoints to prevent brute-force attacks.
  * Security headers via **Helmet**.

---

## 4. Tech Stack

### **Frontend**
* **Core:** React 19, JavaScript (ES6+), HTML5, CSS3
* **Routing:** React Router DOM (v5 / v7 compatibility)
* **UI Components & Styling:** Chakra UI (`@chakra-ui/react`), Tailwind CSS, Emotion (`@emotion/react`, `@emotion/styled`)
* **Icons & Illustrations:** Lucide React (`lucide-react`), React Icons (`react-icons`)
* **Animations:** Framer Motion (`framer-motion`), React Lottie (`react-lottie`)
* **HTTP Client:** Axios
* **Real-time Client:** Socket.io Client (`socket.io-client`)

### **Backend**
* **Runtime:** Node.js (v18+)
* **Framework:** Express.js (v5.1.0)
* **Database:** MongoDB & Mongoose ORM (v9.0.0)
* **Real-Time Engine:** Socket.io Server (v4.8.3)
* **Authentication:** JSON Web Tokens (`jsonwebtoken`), Passwords hashed with `bcryptjs`
* **Security & Middleware:** `helmet`, `cors`, `cookie-parser`, `express-rate-limit`, `express-async-handler`
* **Utilities:** `dotenv`, `colors`

---

## 5. Architecture

TalkSync uses a decoupled client-server architecture with dual communication protocols (HTTP REST API for synchronous operations and WebSockets for real-time bidirectional messaging).

```
 ┌────────────────────────────────────────────────────────┐
 │                   React 19 Frontend                    │
 │    (Chakra UI / Tailwind CSS / Framer Motion / Lottie) │
 └───────────▲────────────────────────────────┬───────────┘
             │                                │
      HTTP / REST API                  Socket.io Client
     (Axios + Bearer Token +            (WebSockets)
      HttpOnly Cookies)                       │
             │                                │
 ┌───────────▼────────────────────────────────▼───────────┐
 │                  Node.js / Express Server              │
 │ ┌────────────────────────────────────────────────────┐ │
 │ │ Middlewares: Helmet | CORS | RateLimit | Sanitizer │ │
 │ ├────────────────────────────────────────────────────┤ │
 │ │ Controllers: User | Chat | Message | Connections   │ │
 │ ├────────────────────────────────────────────────────┤ │
 │ │ Socket.io Manager: Event Emitters & Room Handlers  │ │
 │ └────────────────────────────────────────────────────┘ │
 └──────────────────────────┬─────────────────────────────┘
                            │
                      Mongoose ORM
                            │
 ┌──────────────────────────▼─────────────────────────────┐
 │                    MongoDB Atlas                       │
 │      (Users | Chats | Messages | Connections | Notifs) │
 └────────────────────────────────────────────────────────┘
```

### Communication Flow:
1. **Authentication:** User logs in via `/api/user/login`. Server returns a short-lived Access Token (used in Bearer auth headers) and sets an HttpOnly `refreshToken` cookie.
2. **WebSocket Room Association:** Upon authentication, the client establishes a Socket.io connection and emits a `setup` event to join a private room named after the user's ID.
3. **Chat Messaging:** When a message is sent (`POST /api/message`), the server updates MongoDB and emits a `new message` Socket.io event to the recipient's room.
4. **Notifications:** Backend helper functions (`upsertMessageNotification`) persist unread badges and push real-time `notification` socket events to recipients.

---

## 6. Project Structure

```text
TalkSync/
├── backend/
│   ├── config/
│   │   ├── db.js                   # MongoDB connection setup
│   │   └── generateToken.js        # JWT access and refresh token generators
│   ├── controller/
│   │   ├── chatController.js       # Group/1-on-1 chat creation, rename, member management
│   │   ├── connectionControllers.js # Friend requests, accept, reject, remove connections
│   │   ├── messageController.js    # Send, fetch, and delete messages (for me / everyone)
│   │   ├── notificationControllers.js # Mark notifications as read, fetch pending badges
│   │   └── userControllers.js     # Register, auth, refresh, logout, profile update
│   ├── middlewares/
│   │   ├── authMiddleware.js       # Protect routes via JWT verification
│   │   ├── errorMiddleWare.js      # 404 handler and central error payload formatter
│   │   └── sanitizeMiddleware.js   # Custom NoSQL operator sanitizer for Express 5
│   ├── Modals/
│   │   ├── chatModel.js            # Chat schema (users, groupAdmin, deletedBy, reopenedBy)
│   │   ├── connectionModel.js      # Connection schema (sender, receiver, status, removedBy)
│   │   ├── messageModel.js         # Message schema (deletedFor, isDeletedForEveryone, type)
│   │   ├── notificationModel.js    # Notification schema with 10-day TTL auto-expire index
│   │   └── userModel.js            # User schema (bcrypt pre-save hook, tokenVersion)
│   ├── routes/
│   │   ├── chatRoutes.js           # /api/chat endpoint definitions
│   │   ├── connectionRoutes.js     # /api/connection endpoint definitions
│   │   ├── messageRoutes.js        # /api/message endpoint definitions
│   │   ├── notificationRoutes.js   # /api/notification endpoint definitions
│   │   └── userRoutes.js           # /api/user endpoint definitions (with auth rate limiter)
│   ├── utils/
│   │   ├── connectionUtils.js      # Helpers for connection status checks
│   │   ├── notificationUtils.js    # Logic for aggregating unread message notifications
│   │   ├── socketInstance.js       # Global Socket.io instance export for controllers
│   │   └── validators.js           # String and email validation helpers
│   └── server.js                   # Main application entry point (Express & Socket.io)
├── frontend/
│   ├── public/                     # Static assets and index.html template
│   └── src/
│       ├── animations/             # Lottie JSON animations (typing indicator)
│       ├── assets/                 # Brand illustrations and static images
│       ├── components/
│       │   ├── Authentication/     # Login & Signup form components
│       │   ├── Chatpage/           # Chatbox, ChatMessages, MyChats, SingleChat, Loading
│       │   ├── Profile/            # ProfileModal, ChangePasswordModal
│       │   ├── UserList/           # Search list item & Group selection item components
│       │   ├── others/             # SideBar, GroupChatModal, UpdateGroupChatModal
│       │   └── ui/                 # Reusable UI primitives (Button, Card, Input)
│       ├── config/                 # Chat UI helper logic (sender display, alignment)
│       ├── context/
│       │   └── ChatProvider.js     # Global React Context state manager
│       ├── Pages/
│       │   ├── ChatPage.js         # Main chat dashboard
│       │   ├── ConnectionsPage.jsx # Friend requests & active connections manager
│       │   ├── HomePage.js         # Authentication landing page
│       │   └── ProfilePage.jsx     # User account profile details
│       ├── App.js                  # React router setup
│       ├── index.css               # Design system & Tailwind utility imports
│       └── index.js                # React root mount point
├── .env                            # Server environment variables
├── .gitignore                      # Git exclusion rules
├── package.json                    # Root configuration and build scripts
└── README.md                       # Project documentation
```

---

## 7. Prerequisites

Before running TalkSync locally, ensure you have the following installed:
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher (or `yarn`)
* **MongoDB**: A running MongoDB instance locally or a **MongoDB Atlas** cloud connection URI.
* **Git**: Installed on your system.

---

## 8. Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/anshika-pathak005/TalkSync.git
   cd TalkSync
   ```

2. **Install Root & Backend Dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Install Frontend Dependencies:**
   ```bash
   npm install --prefix frontend --legacy-peer-deps
   ```

4. **Configure Environment Variables:**
   Create a `.env` file in the root folder of the project (refer to Section 9 for details).

---

## 9. Environment Variables

Create a `.env` file in the **root directory** of your project with the following keys:

```env
# Server Port
PORT=5000

# Database Connection String
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.pjiek0c.mongodb.net/talksync?retryWrites=true&w=majority

# JWT Access Token Secret (Short-lived 15m)
JWT_SECRET=your_super_secret_jwt_access_key

# JWT Refresh Token Secret (Long-lived 30d httpOnly Cookie)
JWT_REFRESH_SECRET=your_super_secret_jwt_refresh_key_hash_string

# Node Environment ('development' or 'production')
NODE_ENV=development
```

---

## 10. Running the Application

### **Development Mode**

To run the backend server with `nodemon` (hot reloading) and the React frontend concurrently:

1. **Start the Backend Server:**
   ```bash
   npm start
   ```
   *(Backend will run at `http://localhost:5000`)*

2. **Start the Frontend Development Server (in a second terminal):**
   ```bash
   cd frontend
   npm start
   ```
   *(Frontend will run at `http://localhost:3000` with proxy configured to port 5000)*

---

### **Production Mode**

To test or run the production build locally where Express serves the compiled React application:

1. **Build the Frontend Application:**
   ```bash
   npm run build
   ```

2. **Start the Production Express Server:**
   ```bash
   NODE_ENV=production node backend/server.js
   ```
   *Access the complete app at `http://localhost:5000`.*

---

## 11. API Endpoints

### Auth & User Routes (`/api/user`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/user/` | Register a new user | No (Rate-limited) |
| `POST` | `/api/user/login` | Authenticate user & receive Access Token + Refresh Cookie | No (Rate-limited) |
| `POST` | `/api/user/refresh` | Exchange HttpOnly refresh cookie for new Access Token | No (Rate-limited) |
| `POST` | `/api/user/logout` | Clear refresh cookie & increment token version | Yes |
| `GET` | `/api/user?search=` | Search users by name or email | Yes |
| `PUT` | `/api/user/update-password` | Update current user's password | Yes |
| `PUT` | `/api/user/update-pic` | Update user profile avatar URL | Yes |

---

### Chat Routes (`/api/chat`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/chat/` | Access or create a 1-on-1 chat | Yes |
| `GET` | `/api/chat/` | Fetch all chats for logged-in user | Yes |
| `POST` | `/api/chat/group` | Create a new group chat | Yes |
| `PUT` | `/api/chat/groupRename` | Rename an existing group chat | Yes |
| `PUT` | `/api/chat/groupAdd` | Add a member to a group chat (Admin only) | Yes |
| `PUT` | `/api/chat/groupRemove` | Remove a member from a group chat (Admin only) | Yes |
| `PUT` | `/api/chat/leave` | Leave a group chat | Yes |
| `DELETE`| `/api/chat/delete/:chatId` | Delete/Hide chat for current user | Yes |

---

### Message Routes (`/api/message`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/message/` | Send a new message in a chat | Yes |
| `GET` | `/api/message/:chatId` | Fetch message history for a specific chat | Yes |
| `PUT` | `/api/message/:id/delete-for-me` | Hide message for current user ("Delete for me") | Yes |
| `PUT` | `/api/message/:id/delete-for-everyone` | Overwrite message content permanently for all users | Yes |

---

### Connection Routes (`/api/connection`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/connection/send` | Send a friend request to a target user | Yes |
| `PUT` | `/api/connection/accept` | Accept a pending friend request | Yes |
| `PUT` | `/api/connection/reject` | Reject a pending friend request | Yes |
| `PUT` | `/api/connection/cancel` | Cancel an outbound friend request | Yes |
| `PUT` | `/api/connection/remove` | Unfriend/Remove an established connection | Yes |
| `GET` | `/api/connection/my-connections` | Fetch active friends list | Yes |
| `GET` | `/api/connection/pending` | Fetch incoming pending connection requests | Yes |
| `GET` | `/api/connection/sent` | Fetch outgoing sent connection requests | Yes |
| `GET` | `/api/connection/status/:userId` | Check connection status with a specific user | Yes |

---

### Notification Routes (`/api/notification`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notification/` | Get unread notifications for logged-in user | Yes |
| `PUT` | `/api/notification/read-all` | Mark all user notifications as read | Yes |
| `PUT` | `/api/notification/:id/read` | Mark a specific notification as read | Yes |
| `PUT` | `/api/notification/chat/:chatId/read` | Clear unread notification badge for a specific chat | Yes |

---

## 12. Authentication & Authorization

TalkSync employs an enterprise-grade **Dual-Token Architecture**:

1. **Access Token:**
   * Signed with `JWT_SECRET` with a short 15-minute lifespan.
   * Transmitted in the request header as `Authorization: Bearer <token>`.
2. **Refresh Token:**
   * Signed with `JWT_REFRESH_SECRET` with a 30-day lifespan.
   * Stored securely in an **HttpOnly, SameSite=Strict** cookie sent strictly to `/api/user`.
3. **Instant Session Invalidation (`tokenVersion`):**
   * The User schema stores a numerical `tokenVersion`.
   * When a user logs out or updates their password, `tokenVersion` is incremented in MongoDB.
   * Active refresh cookies carrying old `tokenVersion` numbers are immediately rejected on the next refresh request.

---

## 13. Security

TalkSync incorporates key security practices:

* **NoSQL Injection Prevention:** Features a custom middleware (`sanitizeInput`) that sanitizes incoming body, query, and path parameters by stripping keys containing Mongo operators (such as `$gt`, `$ne`, `$where`) or dot notation.
* **HTTP Security Headers:** Configured with **Helmet** middleware to enforce default security headers (e.g., `X-Content-Type-Options`, `X-Frame-Options`).
* **Rate Limiting:**
  * **Global Limiter:** Protects `/api/*` endpoints with a 300 requests / 15 min window.
  * **Auth Limiter:** Protects sensitive endpoints (`/api/user/login`, `/register`, `/refresh`) with a strict 20 requests / 15 min window to eliminate brute-force password guessing.
* **Password Hashing:** Passwords are auto-hashed using `bcryptjs` salt rounds during user creation and update pre-save hooks.

---

## 14. Deployment (on Render)

TalkSync is configured to be deployed seamlessly on **Render** as a single Web Service.

### **Step-by-Step Deployment Guide:**

1. **Create a New Web Service on Render:**
   * Connect your GitHub repository (`anshika-pathak005/TalkSync`).
   * Select **Node** runtime environment.

2. **Configure Service Settings:**
   * **Root Directory:** *(leave blank for root)*
   * **Build Command:**
     ```bash
     npm run build
     ```
     *(This runs the root build script which executes `npm install` and compiles the React frontend build folder)*
   * **Start Command:**
     ```bash
     npm start
     ```
     *(Executes `nodemon backend/server.js` or `node backend/server.js`)*

3. **Configure Environment Variables on Render:**
   Add the following Environment Variables in your Render dashboard:
   * `NODE_ENV` = `production`
   * `PORT` = `10000` (or leave default assigned by Render)
   * `MONGO_URI` = `your_mongodb_atlas_connection_string`
   * `JWT_SECRET` = `your_production_jwt_access_secret`
   * `JWT_REFRESH_SECRET` = `your_production_jwt_refresh_secret`

4. **Deploy Service:**
   Render will build the React static files and start the Express server serving both the API routes and the React application.

---

## 15. Future Enhancements

* **WebRTC Voice & Video Calls:** Integrate PeerJS / WebRTC for high-quality peer-to-peer voice and video calls.
* **Media & File Attachments:** Integrate Cloudinary / AWS S3 for uploading images, documents, and audio messages.
* **End-to-End Encryption (E2EE):** Client-side message encryption using Signal protocol or Web Crypto API.
* **Global Message Search:** Full-text message indexing in MongoDB for searching text history across all conversations.
* **Online/Offline Status Indicators:** Live presence tracking with Socket.io heartbeat events.

---

## 16. Author

**Anshika Pathak**  
* **GitHub:** [@anshika-pathak005](https://github.com/anshika-pathak005)  
* **Email:** [anshikapathak9026@gmail.com](mailto:anshikapathak9026@gmail.com)

---

## 17. License

This project is licensed under the **ISC License**.
