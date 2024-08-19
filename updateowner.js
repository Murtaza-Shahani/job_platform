const mongoose = require('mongoose');
const Listing = require('./models/listing');  // Adjust the path to your listing model

// Connect to your MongoDB database
const DB_URL = "mongodb://127.0.0.1:27017/jobs_plateform";

mongoose.connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Define the user ID you want to set as the owner
const ownerId = '66c2c9c788c4aab0d8c35416';

// Update all job listings to set the owner field
const setOwnerForAllListings = async () => {
    try {
        const result = await Listing.updateMany({}, { owner: ownerId });
        console.log(`${result.nModified} listings were updated with the owner.`);
    } catch (error) {
        console.error('Error updating listings:', error);
    } finally {
        mongoose.connection.close();
    }
};

// Run the update function
setOwnerForAllListings();
