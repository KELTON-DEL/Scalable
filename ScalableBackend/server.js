
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const supportRoutes = require("./routes/supportRoutes");

const app = express();

// Allowed frontend applications
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
  "https://scalable-qvu2.onrender.com",
  "https://scalable-3add.onrender.com"
].filter(Boolean);

// CORS must come before all API routes
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an origin, such as Postman
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
connectDB();

// Authentication routes
app.use("/api/auth", authRoutes);

// Admin routes
app.use("/api/admin", adminRoutes);

// Customer support chat routes
app.use("/api/support", supportRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("AssetWise API is running");
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);

  if (err.name === "MulterError") {
    return res.status(400).json({
      message:
        err.code === "LIMIT_FILE_SIZE"
          ? "Document must not exceed 5MB."
          : "Document upload failed."
    });
  }

  return res.status(err.message === "Not allowed by CORS" ? 403 : 500).json({
    message: err.message || "Something went wrong."
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`AssetWise server running on port ${PORT}`);
});
