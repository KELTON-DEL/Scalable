
require("dotenv").config();

const mongoose = require("mongoose");

async function fixUserIndexes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDB.");

    const users = mongoose.connection.collection("users");

    // Remove username fields that are explicitly null
    const result = await users.updateMany(
      { username: null },
      { $unset: { username: "" } }
    );

    console.log(
      `Removed null usernames from ${result.modifiedCount} users.`
    );

    // Check existing indexes
    const indexes = await users.indexes();

    const usernameIndex = indexes.find(
      (index) => index.name === "username_1"
    );

    // Drop only the old username index
    if (usernameIndex) {
      await users.dropIndex("username_1");
      console.log("Old username index removed.");
    }

    // Create a sparse unique username index
    await users.createIndex(
      { username: 1 },
      {
        unique: true,
        sparse: true,
        name: "username_1"
      }
    );

    console.log("New sparse username index created successfully!");

  } catch (error) {
    console.error("Index update failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
  }
}

fixUserIndexes();
