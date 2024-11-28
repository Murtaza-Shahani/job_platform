const mongoose = require("mongoose");

const DB_URL = "mongodb://127.0.0.1:27017/jobs_plateform";

const User = require('./models/user'); // Adjust path as needed

// Function to update roles
const updateRoles = async () => {
  try {
    const result = await User.updateMany(
      { role: { $exists: false } }, // Find users with no 'role' field
      { $set: { role: 'user' } }   // Set 'role' to 'user'
    );
    console.log("Roles updated for existing users:", result);
  } catch (error) {
    console.error("Error updating roles:", error);
  }
};

// Main function
async function main() {
  try {
    await mongoose.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Connected to MongoDB successfully");

    await updateRoles(); // Ensure this is called after the connection
  } catch (error) {
    console.error("Error while connecting to MongoDB: ", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

main();
