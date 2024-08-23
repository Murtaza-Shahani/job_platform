const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const app = express();
// Require  models
const Listing = require('./models/listing');
const Employees = require("./models/employees");
const User = require("./models/user.js");


const { saveRedUrl } = require("./middleware");
const { isLoggedIn } = require('./middleware');
//middleware that parses incoming requests like forms, req.body
app.use(express.urlencoded({ extended: true }));

app.use(express.json());
const session = require("express-session");

// Set the view engine to EJS and ensure it looks in the correct folder
app.set('view engine', 'ejs');
//specifies the directory where your view templates are stored
app.set('views', path.join(__dirname, 'views'));
const expressLayouts = require('express-ejs-layouts');

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Define where your layout files are stored
app.set('layout', 'layouts/boilerplates');
//used for layout template that will wrap around your other view templates.
app.use(expressLayouts);
const flash = require("connect-flash");



//athentications modules
const passport = require("passport");
//Passport strategy for authenticating with a username and password.
const LocaltStrategy = require("passport-local");

//defining th options for sessions   secret used for session data on the client side is secure
const sessionOptions ={
    secret: "mysecret",
    resave: false,
    saveUninitialized: true,
    cookie:{
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,


    },
}
//methodoverride coz ejs do not support put methods
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
//using session
app.use(session(sessionOptions));
//using the flash
app.use(flash());

//middlewares for authentication 
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocaltStrategy(User.authenticate()))
//serializerUser means store the user information  session
passport.serializeUser(User.serializeUser());
//used to retrieve user information from the session
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>
    {
        res.locals.success = req.flash("success"); //flash msg for sucess
        res.locals.error = req.flash("error"); // flash msg for error 
        res.locals.user= req.user;  // accessing curr user information in nav bar or other ejs template
        next();
    })
    
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

app.get('/listings', isLoggedIn,async (req, res) => {
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
app.get('/apply/:id', async (req, res) => {
    const jobId = req.params.id;

    // Find the job in the database
    const job = await Listing.findById(jobId);

    // If job not found, redirect with error message
    if (!job) {
        req.flash('error', 'Job not found');
        return res.redirect('/listings');
    }

    // Pass the job object to the template
    res.render('applyform', { job });
});

//route to post/save employee data
app.post('/apply/:jobId', async (req, res) => {
    try {
        // Retrieve job ID from URL parameters
        const jobId = req.params.jobId;

        // Create a new application
        const application = new Employees({
            jobId: jobId,
            userId: req.user._id,
            fullName: req.body.fullName,
            email: req.body.email,
            contact: req.body.contact,
            resumeLink: req.body.resumeLink,
            coverLetter: req.body.coverLetter
        });

        // Save the application to the database
        await application.save();

        req.flash('success', 'Application submitted successfully!');
        res.redirect('/listings');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect(`/listings/${req.params.jobId}`);
    }
});
//addpost Route to render add.ejs 

app.get('/addpost', isLoggedIn, async (req, res) => {
    const ownerId = '66c2c9c788c4aab0d8c35416';

    try {
        // Check if the logged-in user is the owner
        if (!req.user._id.equals(ownerId)) {
            req.flash('error', 'You do not have permission to add job posts.');
            return res.redirect('/listings');
        }
        
        // Render the add post form if the user is the owner
        res.render('add');
    } catch (error) {
        req.flash('error', 'An error occurred.');
        res.redirect('/listings');
    }
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
        req.flash("success", "Job posted  successfully");
        res.redirect('/listings'); // Redirect to the listings page after saving
    } catch (error) {
        console.error('Error adding new job post:', error);
        res.status(500).send('Internal Server Error');
    }
});

//route to render the update.ejs 
// Route to render the update page
app.get('/listings/:id/edit', isLoggedIn, async (req, res) => {
    const { id } = req.params;
    
    try {
        // Find the listing by ID
        const listing = await Listing.findById(id);
        
        // Check if the logged-in user is the owner
        if (listing.owner.equals(req.user._id)) {
            // Render the update.ejs view with the listing details
            res.render('update', { listing });
        } else {
            // If the user is not the owner, redirect with an error message
            req.flash('error', 'You do not have permission to edit this listing.');
            res.redirect(`/listings`);
        }
    } catch (error) {
        console.error('Error finding listing:', error);
        res.redirect('/listings');
    }
});


//edit/put listingroute 
app.put('/listings/:id', isLoggedIn, async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id);

        // Check if the current user is the owner
        if (!listing.owner.equals(req.user._id)) {
            req.flash('error', 'You do not have permission to edit this listing.');
            return res.redirect(`/listings`);
        }

        // Update the listing
        await Listing.findByIdAndUpdate(id, req.body.listing);
        req.flash('success', 'Listing updated successfully.');
        res.redirect(`/listings`);
    } catch (error) {
        req.flash('error', 'Error updating listing.');
        res.redirect(`/listings/${id}`);
    }
});
//route to delete the Listing 
app.delete('/listings/:id', isLoggedIn, async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id);

        // Check if the current user is the owner
        if (!listing.owner.equals(req.user._id)) {
            req.flash('error', 'You do not have permission to delete this listing.');
            return res.redirect(`/listings`);
        }

        // Delete the listing
        await Listing.findByIdAndDelete(id);
        req.flash('success', 'Listing deleted successfully.');
        res.redirect('/listings');
    } catch (error) {
        req.flash('error', 'Error deleting listing.');
        res.redirect(`/listings`);
    }
});
//employees list 
app.get('/applications', isLoggedIn, async (req, res) => {
    const ownerId = '66c2c9c788c4aab0d8c35416';

    try {
        // Check if the logged-in user is the owner
        if (!req.user._id.equals(ownerId)) {
            req.flash('error', 'You do not have permission to view applications.');
            return res.redirect('/listings');
        }
        // Fetch the listings owned by the logged-in user
        const listings = await Listing.find({ owner: req.user._id });
        
        // Extract the listing IDs
        const listingIds = listings.map(listing => listing._id);

        // Find all applications related to the listings owned by the user
        const applications = await Employees.find({ jobId: { $in: listingIds } });
        
        // Fetch the job titles for all the listings
        const jobs = await Listing.find({ _id: { $in: listingIds } });
        const jobTitleMap = jobs.reduce((map, job) => {
            map[job._id] = job.title;
            return map;
        }, {});

        // Count the number of applications
        const applicationCount = applications.length;

        // Render the view and pass the data, including job titles
        res.render('applications', { applicationCount, applications, jobTitleMap });
    } catch (error) {
        console.error('Error fetching applications:', error);
        req.flash('error', 'Unable to fetch applications.');
        res.redirect('/listings');
    }
});
//user dashboard section 
// correect Candidate Dashboard Route

app.get('/dashboard', async (req, res) => {
    try {
        console.log(req.user); 
        // Fetch the user information from the session
        const user = req.user;

        if (!user) {
            req.flash('error', 'You must be logged in to view your profile');
            return res.redirect('/login');
        }

        // Fetch all the job applications made by the user
        const applications = await Employees.find({ userId: user._id }).populate('jobId').exec();

        res.render('dashboard', { user, applications });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect('/');
    }
});




//signup and login part start here


// Route for the signup page
app.get("/signup", (req, res) => {
  res.render("./users/signup.ejs");
});

// Handle user signup
app.post(
  "/signup",
  async (req, res, next) => {
    try {
      const { email, username, password } = req.body;
      const newUser = new User({ email, username });
      const registeredUser = await User.register(newUser, password);
      req.login(registeredUser, (err) => {
        if (err) return next(err);
        req.flash("success", "User registered successfully");
        res.redirect("/listings");
      });
    } catch (e) {
      req.flash("error", e.message);
      res.redirect("/signup");
    }
  }
);

// Route for the login page
app.get("/login", (req, res) => {
  res.render("./users/login.ejs");
});

// Handle user login
app.post(
  "/login",
  saveRedUrl,
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    req.flash("success", "Logged in successfully");
    const redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
  }
);

// Handle user logout
app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "Successfully logged out");
    res.redirect("/");
  });
});




const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
