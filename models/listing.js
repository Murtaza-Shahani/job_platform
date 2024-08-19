const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const JobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    salary: {
        type: String,
    },
    category: {
        type: String,
    },
    requirements: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    owner: {
        type: Schema.Types.ObjectId,  // This indicates that the 'owner' field will store an ObjectId
        ref: 'User',  // 'User' refers to the model name that this ObjectId relates to
        
    }
});

module.exports = mongoose.model('Listing', JobSchema);
