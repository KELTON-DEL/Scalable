const User = require("../models/User");
const fs = require("fs");
const path = require("path");

// Get all users waiting for verification
const getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({
      verificationStatus: "PENDING_VERIFICATION",
      role: "client"
    })
      .select(
        "firstName lastName email phoneNumber country documentType verificationStatus createdAt"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not retrieve pending users."
    });
  }
};

// View a client's uploaded identity document
const viewIdentityDocument = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.identityDocument?.path) {
      return res.status(404).json({
        message: "Identity document not found."
      });
    }

    const uploadDirectory = path.resolve(
      __dirname,
      "../private_uploads/identity"
    );

    const filePath = path.resolve(
      __dirname,
      "..",
      user.identityDocument.path
    );

    // Prevent access to files outside the identity upload directory
    if (!filePath.startsWith(uploadDirectory + path.sep)) {
      return res.status(403).json({
        message: "Invalid document location."
      });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: "Uploaded document is missing."
      });
    }

    res.setHeader(
      "Content-Type",
      user.identityDocument.mimeType || "application/octet-stream"
    );

    res.setHeader(
      "Content-Disposition",
      `inline; filename="${path.basename(user.identityDocument.originalName || "identity-document")}"`
    );

    return res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({
      message: "Could not open identity document."
    });
  }
};

// Approve a client
const approveUser = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      role: "client"
    });

    if (!user) {
      return res.status(404).json({
        message: "Client account not found."
      });
    }

    if (user.verificationStatus !== "PENDING_VERIFICATION") {
      return res.status(400).json({
        message: "This account has already been reviewed."
      });
    }

    user.verificationStatus = "APPROVED";

    await user.save();

    res.status(200).json({
      success: true,
      message: "Client account approved successfully."
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not approve client."
    });
  }
};

// Reject a client
const rejectUser = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      role: "client"
    });

    if (!user) {
      return res.status(404).json({
        message: "Client account not found."
      });
    }

    if (user.verificationStatus !== "PENDING_VERIFICATION") {
      return res.status(400).json({
        message: "This account has already been reviewed."
      });
    }

    user.verificationStatus = "REJECTED";

    await user.save();

    res.status(200).json({
      success: true,
      message: "Client account rejected."
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not reject client."
    });
  }
};


const getAllClients = async (req, res) => {
  try {
    const clients = await User.find({ role: "client" })
      .select(
        "firstName lastName email phoneNumber country documentType verificationStatus balance createdAt"
      )
      .sort({ createdAt: -1 });

    const totalClients = clients.length;

    const verifiedClients = clients.filter(
      (client) => client.verificationStatus === "APPROVED"
    );

    const pendingClients = clients.filter(
      (client) =>
        client.verificationStatus === "PENDING_VERIFICATION"
    );

    return res.status(200).json({
      success: true,
      totalClients,
      verifiedClients: verifiedClients.length,
      pendingClients: pendingClients.length,
      clients
    });
  } catch (error) {
    console.error("Get all clients error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve client accounts."
    });
  }
};


const updateClientBalance = async (req, res) => {
  try {
    const { id } = req.params;
    const { balance } = req.body;

    if (
      balance === undefined ||
      balance === null ||
      balance === "" ||
      !Number.isFinite(Number(balance)) ||
      Number(balance) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid balance of zero or more."
      });
    }

    const client = await User.findOne({
      _id: id,
      role: "client"
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client account not found."
      });
    }

    // Set the client's balance to the new amount
    client.balance = Number(balance);

    await client.save();

    return res.status(200).json({
      success: true,
      message: "Client balance updated successfully.",
      balance: client.balance,
      client: {
        id: client._id,
        firstName: client.firstName,
        lastName: client.lastName,
        balance: client.balance
      }
    });

  } catch (error) {
    console.error("Update client balance error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update client balance."
    });
  }
};

module.exports = {
  getPendingUsers,
  viewIdentityDocument,
  approveUser,
  rejectUser,
  getAllClients,
  updateClientBalance
};