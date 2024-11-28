const mongoose = require("mongoose");

const DB_URL = "mongodb://127.0.0.1:27017/jobs_plateform";

const Employees = require('./models/employees'); // Adjust path as needed

// Function to update the `status` and `interview` fields for existing records
async function updateEmployeeStatuses() {
  try {
    // Update existing records where `status` or `interview` fields are missing
    const result = await Employees.updateMany(
      {
        $or: [
          { status: { $exists: false } }, // Find records without a `status` field
          { interview: { $exists: false } }, // Find records without an `interview` field
        ],
      },
      {
        $set: {
          status: "Pending", // Set `status` to "Pending" if it doesn't exist
          interview: {
            status: null, // Default interview status
            date: null,   // Default interview date
            mode: null,   // Default interview mode
            location: null, // Default interview location
          },
        },
      }
    );
    console.log(`${result.modifiedCount} employee records updated with default status and interview fields.`);
  } catch (error) {
    console.error("Error updating employee statuses:", error);
  }
}

// Main function
async function main() {
  try {
    await mongoose.connect(DB_URL);
    console.log("Connected to MongoDB successfully");

    await updateEmployeeStatuses(); // Ensure this is called after the connection
  } catch (error) {
    console.error("Error while connecting to MongoDB: ", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

main();
