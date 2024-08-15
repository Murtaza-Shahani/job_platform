

const mongoose = require("mongoose");
const initdata = require("./data");

const Listing = require("../models/listing.js");


const DB_URL = "mongodb://127.0.0.1:27017/jobs_plateform";


const initDB = async () => {
  try {
    console.log("Inserting new data...");
    console.log(typeof Listing.insertMany); // Should output: function


    await Listing.insertMany(initdata.data);
    console.log("Data was initialized.");

    const currentData = await Listing.find({});
    console.log("Current listings in the database: ", currentData);
  } catch (error) {
    console.error("Error initializing database: ", error);
  }
};

async function main() {
  try {
    await mongoose.connect(DB_URL);
    console.log("Connected to MongoDB successfully");

    await initDB();
  } catch (error) {
    console.error("Error while connecting to MongoDB: ", error);
  }
}

main();

