const mongoose = require("mongoose");

const supportMessageSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    sender: {
      type: String,
      enum: ["client", "admin"],
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

supportMessageSchema.index({ client: 1, createdAt: 1 });

module.exports = mongoose.model("SupportMessage", supportMessageSchema);