
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");

const {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Private identity document storage
const uploadDirectory = path.join(
  __dirname,
  "../private_uploads/identity"
);

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    cb(
      null,
      `${crypto.randomUUID()}${extension}`
    );
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf"
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG and PDF documents are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false
});

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false
});

// Registration
router.post(
  "/register",
  upload.single("identityDocument"),
  register
);

// Login
router.post("/login", loginLimiter, login);

// Forgot password
router.post("/forgot-password", resetLimiter, forgotPassword);

// Reset password
router.post(
  "/reset-password/:token",
  resetLimiter,
  resetPassword
);

// Logged-in client details
router.get("/me", protect, getMe);

module.exports = router;
