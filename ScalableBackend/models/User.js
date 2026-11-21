
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: function () {
        return this.role === "client";
      },
      trim: true
    },

    lastName: {
      type: String,
      required: function () {
        return this.role === "client";
      },
      trim: true
    },

    username: {
      type: String,
      required: function () {
        return this.role === "admin";
      },
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true
    },

    email: {
      type: String,
      required: function () {
        return this.role === "client";
      },
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true
    },

    phoneNumber: {
      type: String,
      required: function () {
        return this.role === "client";
      },
      unique: true,
      sparse: true
    },

    country: {
      type: String,
      required: function () {
        return this.role === "client";
      }
    },

    password: {
      type: String,
      required: true,
      select: false
    },

    role: {
      type: String,
      enum: ["client", "admin"],
      default: "client"
    },

    balance: {
      type: Number,
      default: 0,
      min: 0
    },

    verificationStatus: {
      type: String,
      enum: ["PENDING_VERIFICATION", "APPROVED", "REJECTED"],
      default: "PENDING_VERIFICATION"
    },

    documentType: {
      type: String,
      enum: ["National ID", "Passport", "Driving Licence"],
      required: function () {
        return this.role === "client";
      }
    },

    identityDocument: {
      filename: String,
      originalName: String,
      mimeType: String,
      path: String
    },

    resetPasswordToken: String,
    resetPasswordExpires: Date
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);
