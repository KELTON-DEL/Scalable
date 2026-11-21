const mongoose = require("mongoose");
const User = require("../models/User");
const SupportMessage = require("../models/SupportMessage");

// CLIENT: GET OWN CONVERSATION
exports.getClientMessages = async (req, res) => {
  try {
    const clientId = req.user.id;

    const messages = await SupportMessage.find({ client: clientId })
      .sort({ createdAt: 1 })
      .lean();

    // Mark administrator replies as read by the client
    await SupportMessage.updateMany(
      { client: clientId, sender: "admin", isRead: false },
      { $set: { isRead: true } }
    );

    return res.status(200).json({ messages });
  } catch (error) {
    console.error("Get client messages:", error);
    return res.status(500).json({ message: "Unable to load your messages." });
  }
};

// CLIENT: SEND MESSAGE TO ADMIN
exports.sendClientMessage = async (req, res) => {
  try {
    const message = req.body.message?.trim();

    if (!message) {
      return res.status(400).json({ message: "Please enter a message." });
    }

    if (message.length > 3000) {
      return res.status(400).json({ message: "Message is too long." });
    }

    const client = await User.findOne({
      _id: req.user.id,
      role: "client"
    }).select("_id");

    if (!client) {
      return res.status(404).json({ message: "Client account not found." });
    }

    const savedMessage = await SupportMessage.create({
      client: client._id,
      sender: "client",
      message
    });

    return res.status(201).json({
      message: "Message sent successfully.",
      supportMessage: savedMessage
    });
  } catch (error) {
    console.error("Send client message:", error);
    return res.status(500).json({ message: "Unable to send your message." });
  }
};

// ADMIN: GET ALL CLIENT CONVERSATIONS
exports.getSupportConversations = async (req, res) => {
  try {
    const allMessages = await SupportMessage.find()
      .sort({ createdAt: -1 })
      .lean();

    const latestByClient = new Map();

    for (const message of allMessages) {
      const clientId = String(message.client);

      if (!latestByClient.has(clientId)) {
        latestByClient.set(clientId, {
          clientId,
          lastMessage: message,
          unreadCount: 0
        });
      }

      if (message.sender === "client" && !message.isRead) {
        latestByClient.get(clientId).unreadCount += 1;
      }
    }

    const clientIds = [...latestByClient.keys()];

    const clients = await User.find({
      _id: { $in: clientIds },
      role: "client"
    }).select("firstName lastName email");

    const clientMap = new Map(
      clients.map(client => [String(client._id), client])
    );

    const conversations = [...latestByClient.values()]
      .filter(item => clientMap.has(item.clientId))
      .map(item => ({
        client: clientMap.get(item.clientId),
        lastMessage: item.lastMessage,
        unreadCount: item.unreadCount
      }));

    return res.status(200).json({ conversations });
  } catch (error) {
    console.error("Get support conversations:", error);
    return res.status(500).json({
      message: "Unable to load support conversations."
    });
  }
};

// ADMIN: GET MESSAGES FOR ONE CLIENT
exports.getAdminClientMessages = async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({ message: "Invalid client ID." });
    }

    const client = await User.findOne({
      _id: clientId,
      role: "client"
    }).select("firstName lastName email");

    if (!client) {
      return res.status(404).json({ message: "Client not found." });
    }

    const messages = await SupportMessage.find({ client: clientId })
      .sort({ createdAt: 1 })
      .lean();

    // Mark client messages as read by admin
    await SupportMessage.updateMany(
      { client: clientId, sender: "client", isRead: false },
      { $set: { isRead: true } }
    );

    return res.status(200).json({ client, messages });
  } catch (error) {
    console.error("Get admin client messages:", error);
    return res.status(500).json({ message: "Unable to load this conversation." });
  }
};

// ADMIN: REPLY TO CLIENT
exports.replyToClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    const message = req.body.message?.trim();

    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({ message: "Invalid client ID." });
    }

    if (!message) {
      return res.status(400).json({ message: "Please enter a reply." });
    }

    if (message.length > 3000) {
      return res.status(400).json({ message: "Reply is too long." });
    }

    const client = await User.findOne({
      _id: clientId,
      role: "client"
    }).select("_id");

    if (!client) {
      return res.status(404).json({ message: "Client not found." });
    }

    const savedMessage = await SupportMessage.create({
      client: client._id,
      sender: "admin",
      message
    });

    return res.status(201).json({
      message: "Reply sent successfully.",
      supportMessage: savedMessage
    });
  } catch (error) {
    console.error("Reply to client:", error);
    return res.status(500).json({ message: "Unable to send your reply." });
  }
};