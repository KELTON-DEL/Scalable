
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readline = require("readline/promises");
const User = require("../models/User");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("\nConnected to MongoDB!");

    // Prevent accidental creation of additional administrators
   const existingAdmins = await User.find(
  { role: "admin" },
  "firstName lastName email role verificationStatus"
);

console.log("Existing administrators:", existingAdmins);

    const firstName = await rl.question("First name: ");
    const lastName = await rl.question("Last name: ");
    const username = (await rl.question("Username: ")).trim();
    const email = (await rl.question("Email: ")).trim().toLowerCase();
    const phoneNumber = (await rl.question("Phone number: ")).trim();
    const country = await rl.question("Country: ");
    const password = await rl.question("Create password: ");

   if (!firstName || !lastName || !username || !email || !phoneNumber || !country) {
  throw new Error("All fields are required.");
}

    if (password.length < 8) {
      throw new Error("Password must contain at least 8 characters.");
    }

   const existingUser = await User.findOne({
  $or: [
    { email },{ phoneNumber },{ username }
  ]
});

    if (existingUser) {
      throw new Error("This email or phone number is already registered.");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await User.create({
      firstName,
      lastName,
        username,
      email,
      phoneNumber,
      country,
      password: hashedPassword,
      role: "admin",
      verificationStatus: "APPROVED",
      balance: 0
    });

    console.log("\nAdministrator created successfully!");
    console.log("Name:", admin.firstName, admin.lastName);
    console.log("Email:", admin.email);
    console.log("Role:", admin.role);
    console.log("Status:", admin.verificationStatus);

  } catch (error) {
    console.error("\nError:", error.message);
  } finally {
    rl.close();
    await mongoose.disconnect();
  }
}

createAdmin();
