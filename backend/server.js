import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";
import helmet from "helmet";
import session from "express-session";
import MongoStore from "connect-mongo";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createHttpsServer } from "https";
import fs from "fs";
import errorHandler from "./middleware/errorHandler.js";
import Menu from "./models/MenuItem.js";
import menuRoutes from "./routes/menuRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import categoryRoutes from "./routes/categories.js";
import offerRoutes from "./routes/offerRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import offerAnalyticsRouter from "./routes/offerAnalytics.js";
import tableRoutes from "./routes/tableRoutes.js";
import orderRoutes from "./routes/orders.js";
import SorderRoutes from "./routes/orderRoutes.js";
import deliveryPersonRoutes from "./routes/deliveryPersonRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import Message from "./models/Message.js";
//import { setupMessageHandlers } from "./controllers/messageController.js";
import authRouter from "./routes/authRoutesUser.js";
import userRouter from "./routes/userRoutes.js";
import cookieParser from "cookie-parser";
import synRoutes from "./routes/synRoutes.js";
import HomeOrderRoutes from "./routes/HomeOrderRoutes.js";
import ContactRouter from "./routes/ContactRouter.js";
import messageRoutes from "./routes/messageRoutes.js";
import feedbackRoute from "./routes/feedbackRoute.js";
dotenv.config();

const app = express();

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://localhost:5173",
    "http://localhost:5174",
    "https://localhost:5174",
    "http://localhost:5175",
    "https://localhost:5175",
    "http://localhost:3000",
    "https://localhost:3001",
    "http://localhost:5176",
    "http://192.168.8.156:5174",
     "http://192.168.8.156:5000",
    "http://192.168.8.156:5000",
     "http://192.168.8.156:5174",
     
    , // Keep this if it's a frontend origin
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-auth-token", "Cache-Control"], // Added Cache-Control
};

app.use(helmet());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/foodDB",
      ttl: 14 * 24 * 60 * 60,
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { error: err.message }),
  });
});

app.post("/chatbot", async (req, res) => {
  const { userMessage } = req.body;
  try {
    const priceQueryRegex = /(price|cost|how much).*?(cola|plain dosa|plain dose|[\w\s]+)/i;
    const priceMatch = userMessage.match(priceQueryRegex);

    if (priceMatch) {
      const itemName = priceMatch[2].trim();
      const item = await Menu.findOne({
        name: { $regex: new RegExp(itemName, "i") },
      });

      if (item) {
        return res.json({
          message: `The price of ${item.name} is Rs. ${item.price}`,
        });
      }
    }

    const menuItems = await Menu.find();
    const menuText = menuItems.map((item) => `${item.name}: Rs. ${item.price}`).join("\n");

    const aiResponse = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a restaurant assistant in Sri Lanka. 
            All prices are in Sri Lankan Rupees (Rs.). Here's our menu:
            ${menuText}
            address: karampaikkurichchi West varany, varany ammakadi Street, point pedro Road.  
            google map: https://maps.app.goo.gl/T9mwwVi26Eq6qCds7
            
            Rules:
            1. Always use Rs. for prices
            2. Never invent prices - use only what's provided
            3. If unsure about a price, say "Please check with staff" also suggest any dish already in database
            4. When asked about ordering, tell them there are three ways: home, takeaway, and in-restaurant; for in-restaurant, they can scan a QR code to the menu page; for home orders, the address must be within 10km of the restaurant, and they can add menu items to their cart, choose a payment method, and enjoy
            5. If someone asks you to order, politely decline
            6. If asked for recommendations, check and suggest based on the menu
            7. For pittu, offer sambar and coconut sambol; other curries are available on request`,
          },
          { role: "user", content: userMessage },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": req.headers.origin || "http://localhost:5000",
          "X-Title": "Restaurant Chatbot",
          "Content-Type": "application/json",
        },
      }
    );

    res.json({
      message: aiResponse.data.choices[0].message.content,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      message: "Sorry, I'm having trouble responding. Please try again later.",
    });
  }
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));

app.use("/api/menu", menuRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/offer/analytics", offerAnalyticsRouter);
app.use("/api/tables", tableRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/Sorders", SorderRoutes);
app.use("/api/home-orders", SorderRoutes);
app.use("/api/in-restaurant-orders", SorderRoutes);
app.use("/api/processed-orders", SorderRoutes);
app.use("/api/delivery-persons", deliveryPersonRoutes);
app.use("/api/delivered-orders", deliveryRoutes);
app.use("/api/failed-orders", deliveryRoutes);
app.use("/api/dorders/", deliveryPersonRoutes);
app.use("/api/authHome", authRouter);
app.use("/api/user", userRouter); 
app.use("/api/contact", ContactRouter);
app.use("/api/orderSyn", synRoutes);
app.use("/api/homeOrder", HomeOrderRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/feedback", feedbackRoute);
app.get("/", (req, res) => {
  res.json({ message: "API is running..." });
});

const httpServer = createServer(app);

const sslOptions = {
  key: fs.readFileSync("localhost-key.pem"),
  cert: fs.readFileSync("localhost.pem"),
  rejectUnauthorized: false,
};

const httpsServer = createHttpsServer(sslOptions, app);

// Create Socket.IO instance for HTTP server (from second file)
const ioHttp = new Server(httpServer, {
  cors: corsOptions,
  path: "/socket.io",
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"],
  connectionTimeout: 30000,
});

// Create Socket.IO instance for HTTPS server (existing)
const ioHttps = new Server(httpsServer, {
  cors: corsOptions,
  path: "/socket.io",
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket", "polling"],
  connectionTimeout: 30000,
});

app.set("io", ioHttps); // Keep HTTPS Socket.IO as primary
app.set("ioHttp", ioHttp); // Store HTTP Socket.IO for messaging

// Socket.IO event handlers for HTTP server (from second file)
ioHttp.on("connection", (socket) => {
  console.log("New HTTP client connected:", socket.id);

  socket.on("joinOrder", (orderId) => {
    socket.join(orderId);
    console.log(`HTTP Client ${socket.id} joined order ${orderId}`);
  });

  socket.on("locationUpdate", ({ orderId, lat, lng }) => {
    console.log(`HTTP Received locationUpdate for order ${orderId}:`, { lat, lng });
    ioHttp.to(orderId).emit("locationUpdate", { lat, lng });
  });

  let sanitizeHtml;
  try {
    sanitizeHtml = require("sanitize-html");
  } catch (err) {
    console.log("sanitize-html not installed. Skipping sanitization.");
  }

  socket.on("sendMessage", async (message) => {
    try {
      console.log("HTTP Received sendMessage event:", message);
      if (sanitizeHtml) {
        message.content = sanitizeHtml(message.content, {
          allowedTags: [],
          allowedAttributes: {},
        });
      }

      const newMessage = new Message({
        senderId: message.senderId,
        senderName: message.senderName,
        recipientId: message.recipientId,
        content: message.content,
        timestamp: new Date(message.timestamp),
        recipientType: message.recipientType,
        read: false,
      });

      await newMessage.save();
      console.log("HTTP Message saved to DB:", newMessage);

      socket.join(message.senderId);
      socket.join(message.recipientId);

      ioHttp.to(message.senderId).to(message.recipientId).emit("newMessage", newMessage);
      console.log(`HTTP Emitted newMessage to rooms: ${message.senderId}, ${message.recipientId}`);

      ioHttp.to(message.recipientId).emit("newMessageNotification", {
        senderId: message.senderId,
        senderName: message.senderName,
        content: message.content,
        timestamp: newMessage.timestamp,
      });
    } catch (error) {
      console.error("HTTP Error saving message to DB:", error);
      socket.emit("messageError", { error: "Failed to save message" });
    }
  });

  socket.on("fetchMessages", async ({ userId, recipientId, recipientType }) => {
    try {
      socket.join(userId);
      console.log(`HTTP User ${userId} joined room for recipientType ${recipientType}`);

      const query = recipientId
        ? {
            recipientType,
            $or: [
              { senderId: userId, recipientId },
              { senderId: recipientId, recipientId: userId },
            ],
          }
        : {
            recipientType,
            $or: [{ senderId: userId }, { recipientId: userId }],
          };

      const messages = await Message.find(query).sort({ timestamp: 1 });

      console.log(
        `HTTP Fetched messages for user ${userId}, recipient ${recipientId || "all"}, recipientType ${recipientType}:`,
        messages
      );
      socket.emit("loadMessages", messages);
    } catch (error) {
      console.error("HTTP Error fetching messages:", error);
      socket.emit("messageError", { error: "Failed to fetch messages" });
    }
  });

  socket.on("markMessagesAsRead", async ({ userId, senderId, recipientType }) => {
    try {
      await Message.updateMany(
        {
          senderId,
          recipientId: userId,
          recipientType,
          read: false,
        },
        { $set: { read: true } }
      );
      console.log(`HTTP Marked messages as read for user ${userId} from sender ${senderId}`);
    } catch (error) {
      console.error("HTTP Error marking messages as read:", error);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("HTTP Client disconnected:", socket.id, "Reason:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("HTTP Socket.IO connection error:", error.message);
  });

  socket.on("error", (error) => {
    console.error("HTTP Socket.IO error:", error.message);
  });
});

// Socket.IO event handlers for HTTPS server (existing)
ioHttps.on("connection", (socket) => {
  console.log("New HTTPS client connected:", socket.id);

  socket.on("joinOrder", (orderId) => {
    socket.join(orderId);
    console.log(`HTTPS Client ${socket.id} joined order ${orderId}`);
  });

  socket.on("locationUpdate", ({ orderId, lat, lng }) => {
    console.log(`HTTPS Received locationUpdate for order ${orderId}:`, { lat, lng });
    ioHttps.to(orderId).emit("locationUpdate", { lat, lng });
  });

  let sanitizeHtml;
  try {
    sanitizeHtml = require("sanitize-html");
  } catch (err) {
    console.log("sanitize-html not installed. Skipping sanitization.");
  }

  socket.on("sendMessage", async (message) => {
    try {
      console.log("HTTPS Received sendMessage event:", message);
      if (sanitizeHtml) {
        message.content = sanitizeHtml(message.content, {
          allowedTags: [],
          allowedAttributes: {},
        });
      }

      const newMessage = new Message({
        senderId: message.senderId,
        senderName: message.senderName,
        recipientId: message.recipientId,
        content: message.content,
        timestamp: new Date(message.timestamp),
        recipientType: message.recipientType,
        read: false,
      });

      await newMessage.save();
      console.log("HTTPS Message saved to DB:", newMessage);

      socket.join(message.senderId);
      socket.join(message.recipientId);

      ioHttps.to(message.senderId).to(message.recipientId).emit("newMessage", newMessage);
      console.log(`HTTPS Emitted newMessage to rooms: ${message.senderId}, ${message.recipientId}`);

      ioHttps.to(message.recipientId).emit("newMessageNotification", {
        senderId: message.senderId,
        senderName: message.senderName,
        content: message.content,
        timestamp: newMessage.timestamp,
      });
    } catch (error) {
      console.error("HTTPS Error saving message to DB:", error);
      socket.emit("messageError", { error: "Failed to save message" });
    }
  });

  socket.on("fetchMessages", async ({ userId, recipientId, recipientType }) => {
    try {
      socket.join(userId);
      console.log(`HTTPS User ${userId} joined room for recipientType ${recipientType}`);

      const query = recipientId
        ? {
            recipientType,
            $or: [
              { senderId: userId, recipientId },
              { senderId: recipientId, recipientId: userId },
            ],
          }
        : {
            recipientType,
            $or: [{ senderId: userId }, { recipientId: userId }],
          };

      const messages = await Message.find(query).sort({ timestamp: 1 });

      console.log(
        `HTTPS Fetched messages for user ${userId}, recipient ${recipientId || "all"}, recipientType ${recipientType}:`,
        messages
      );
      socket.emit("loadMessages", messages);
    } catch (error) {
      console.error("HTTPS Error fetching messages:", error);
      socket.emit("messageError", { error: "Failed to fetch messages" });
    }
  });

  socket.on("markMessagesAsRead", async ({ userId, senderId, recipientType }) => {
    try {
      await Message.updateMany(
        {
          senderId,
          recipientId: userId,
          recipientType,
          read: false,
        },
        { $set: { read: true } }
      );
      console.log(`HTTPS Marked messages as read for user ${userId} from sender ${senderId}`);
    } catch (error) {
      console.error("HTTPS Error marking messages as read:", error);
    }
  });

  setupMessageHandlers(ioHttps, socket);

  socket.on("disconnect", (reason) => {
    console.log("HTTPS Client disconnected:", socket.id, "Reason:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("HTTPS Socket.IO connection error:", error.message);
  });

  socket.on("error", (error) => {
    console.error("HTTPS Socket.IO error:", error.message);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, "0.0.0.0", () =>
  console.log(`HTTP Server running on port ${PORT} with Socket.IO`)
);

const HTTPS_PORT = 3001;
httpsServer.listen(HTTPS_PORT, () =>
  console.log(`HTTPS Server for Socket.IO running on port ${HTTPS_PORT}`)
);

app.use(errorHandler);