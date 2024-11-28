const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        required: true
    },
    resumeLink: {
        type: String,
        required: true
    },
    coverLetter: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        default: 'Pending'
    },
    interview: {
        date: Date, // Interview date and time
        mode: String, // "In-person" or "Online"
        location: String, // Address or meeting link
        status: { type: String, default: 'Pending' } // "Pending", "Scheduled", "Completed"
    }
});

module.exports = mongoose.model('Employees', EmployeeSchema);
