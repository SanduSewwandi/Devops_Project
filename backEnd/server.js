import express from "express";
import cors from "cors";
import connectDB from "./config/mongodb.js";
import dotenv from "dotenv";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./routes/userRoute.js";
import plantRouter from "./routes/plantRoute.js";

dotenv.config();

// Initialize Express
const app = express();

// Connect to DB + Cloudinary
connectDB();
connectCloudinary();

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); 

// Debugging middleware (optional, remove in production)
app.use((req, res, next) => {
  if (req.method === "GET") {
    console.log(`${req.method} ${req.url}`);
  } else {
    console.log(`${req.method} ${req.url}`, req.body);
  }
  next();
});

// API endpoints
app.use("/api/user", userRouter);
app.use("/api/plant", plantRouter);

// Test route
app.get("/", (req, res) => {
  res.send("API Working ✅");
});

// Catch-all 404 route
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on PORT: ${PORT}`));
