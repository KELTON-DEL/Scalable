const express = require("express");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const {
  getClientMessages,
  sendClientMessage,
  getSupportConversations,
  getAdminClientMessages,
  replyToClient
} = require("../controllers/supportController");

const router = express.Router();

// Client support chat
router.get("/messages", protect, getClientMessages);
router.post("/messages", protect, sendClientMessage);

// Admin support inbox
router.get(
  "/admin/conversations",
  protect,
  adminOnly,
  getSupportConversations
);

router.get(
  "/admin/conversations/:clientId/messages",
  protect,
  adminOnly,
  getAdminClientMessages
);

router.post(
  "/admin/conversations/:clientId/reply",
  protect,
  adminOnly,
  replyToClient
);

module.exports = router;