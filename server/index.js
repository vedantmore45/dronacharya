import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import missionRoutes from "./routes/missionRoutes.js";
import droneRoutes from "./routes/droneRoutes.js";
import telemetryRoutesFactory from "./routes/telemetryRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

dotenv.config();
connectDB();
const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/missions", missionRoutes);
app.use("/api/drones", droneRoutes);
app.use("/api/reports", reportRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Basic test route
app.get("/", (req, res) => {
  res.send("Dronacharya API is running...");
});

// Start server with socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("New client connected");
  socket.on("disconnect", () => console.log("Client disconnected"));
});

// Register telemetry routes after io is available
app.use("/api/telemetry", telemetryRoutesFactory(io));

server.listen(5000, () => console.log("Server running on port 5000"));
