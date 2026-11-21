
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readline = require("readline/promises");
const User = require("../models/User");

const ADMIN_ID = "6a43ea275761a31aab29b17c";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function updateAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const admin = await User.findById(ADMIN_ID).select("+password");

    if (!admin) {
      throw new Error("Administrator account not found.");
    }

    if (admin.role !== "admin") {
      throw new Error("This account is not an administrator.");
    }

    console.log("\nExisting administrator found:");
    console.log("Name:", admin.firstName);
    console.log("Role:", admin.role);

    const username = (
      await rl.question("\nEnter admin username (kelly): ")
    ).trim().toLowerCase();

    const password = await rl.question("Enter new admin password: ");
    const confirmPassword = await rl.question("Confirm new password: ");

    if (!username || !password) {
      throw new Error("Username and password are required.");
    }

    if (password.length < 8) {
      throw new Error("Password must have at least 8 characters.");
    }

    if (password !== confirmPassword) {
      throw new Error("Passwords do not match.");
    }

    const existingUsername = await User.findOne({
      username,
      _id: { $ne: ADMIN_ID }
    });

    if (existingUsername) {
      throw new Error("That username is already taken.");
    }

    admin.username = username;
    admin.password = await bcrypt.hash(password, 12);
    admin.verificationStatus = "APPROVED";

    await admin.save();

    console.log("\nAdministrator updated successfully!");
    console.log("Username:", admin.username);
    console.log("Role:", admin.role);
    console.log("Verification:", admin.verificationStatus);

  } catch (error) {
    console.error("\nUpdate failed:", error.message);
  } finally {
    rl.close();
    await mongoose.disconnect();
  }
}

updateAdmin();
