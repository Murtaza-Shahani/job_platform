const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set the view engine to EJS and ensure it looks in the correct folder
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
const expressLayouts = require('express-ejs-layouts');

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressLayouts);
// Define where your layout files are stored
app.set('layout', 'layouts/boilerplates');
// Require Listing model
const Listing = require('./models/listing');
const Employees = require("./models/employees");

// MongoDB connection
const DB_URL = "mongodb://127.0.0.1:27017/jobs_plateform";

async function main() {
    try {
        await mongoose.connect(DB_URL);
        console.log("Connected to MongoDB successfully");
    } catch (error) {
        console.error("Error while connecting to MongoDB: ", error);
    }
}

main();

//home page
// Home page
app.get("/", (req, res) => {
    res.render("home");
});


// Display all jobs route
// Display all jobs route with filtering

app.get('/listings', async (req, res) => {
    try {
        const { category, location, salary } = req.query;
        let filters = {};

        // Apply filters only if they are provided
        if (category) {
            filters.category = category;
        }

        if (location) {
            filters.location = location;
        }

        if (salary) {
            if (salary === 'gt10000') {
                filters.salary = { $gt: 10000 };
            } else if (salary === 'lt10000') {
                filters.salary = { $lt: 10000 };
            }
        }

        // Fetch listings based on filters (if any)
        const listings = await Listing.find(filters);
        res.render("show", { listings });
    } catch (error) {
        console.error("Error fetching listings:", error);
        res.status(500).send("Internal Server Error");
    }
});



//render applyform route 
app.get('/apply/:id', (req, res) => {
    const jobId = req.params.id;
    res.render('applyform', { jobId });
});
//route to post/save employee data
app.post('/apply', async (req, res) => {
    try {
        const { jobId, fullName, email, contact, resumeLink, coverLetter } = req.body;

        const newApplication = new Employees({
            jobId: jobId,
            fullName: fullName,
            email: email,
            contact: contact,
            resumeLink: resumeLink, // Save the resume link
            coverLetter: coverLetter
        });

        await newApplication.save();
        console.log("new application saved successfully", newApplication )
        res.redirect('/listings'); // Redirect after successful submission
    } catch (error) {
        console.error("Error saving application:", error);
        res.status(500).send("Internal Server Error");
    }
}); 

//addpost Route to render add.ejs
app.get('/addpost', (req, res) => {
    res.render('add');
});

// Route to handle form submission and save job post
app.post('/add-post', async (req, res) => {
    try {
        const { title, description, location, salary, category, requirements } = req.body;

        const newJob = new Listing({
            title,
            description,
            location,
            salary,
            category,
            requirements,
        });

        await newJob.save();
        res.redirect('/listings'); // Redirect to the listings page after saving
    } catch (error) {
        console.error('Error adding new job post:', error);
        res.status(500).send('Internal Server Error');
    }
});


const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
