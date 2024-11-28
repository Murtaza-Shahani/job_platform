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
    //const ownerId = '66c2c9c788c4aab0d8c35416';

    try {
        // Check if the logged-in user is the owner
        if (req.user.role !== 'owner') {
            req.flash('error', 'You do not have permission to view applications.');
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
        
        // Check if the logged-in user is the owner (role-based check)
        if (req.user.role === 'owner' ) {
            // Render the update.ejs view with the listing details
            res.render('update', { listing });
        } else {
            req.flash('error', 'You do not have permission to edit this listing.');
            res.redirect(`/listings`);
        }
    } catch (error) {
        console.error('Error finding listing:', error);
        req.flash('error', 'Error finding the listing.');
        res.redirect('/listings');
    }
});


//edit/put listingroute 
app.put('/listings/:id', isLoggedIn, async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id);

        // Check if the current user is the owner (role-based check)
        if (req.user.role !== 'owner' || !listing.owner.equals(req.user._id)) {
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

        // Check if the current user is the owner (role-based check)
        if (req.user.role !== 'owner' || !listing.owner.equals(req.user._id)) {
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
    try {
        // Ensure only owners can access this route
        if (req.user.role !== 'owner') {
            req.flash('error', 'You do not have permission to view applications.');
            return res.redirect('/listings');
        }

        // Step 1: Fetch all applications
        const applications = await Employees.find({}).populate('jobId'); // Populate to get job details
        console.log("Applications found:", applications); // Debug: Verify fetched applications

        if (applications.length === 0) {
            req.flash('info', 'No applications received yet.');
            return res.render('applications', { applicationCount: 0, applications: [], jobTitleMap: {} });
        }

        // Step 2: Fetch job titles for applications
        const jobTitleMap = {};
        applications.forEach(application => {
            if (application.jobId) {
                jobTitleMap[application.jobId._id] = application.jobId.title;
            }
        });

        // Step 3: Count the number of applications
        const applicationCount = applications.length;

        // Step 4: Render the view and pass the data
        res.render('applications', { applicationCount, applications, jobTitleMap });
    } catch (error) {
        console.error('Error fetching applications:', error);
        req.flash('error', 'Unable to fetch applications.');
        res.redirect('/listings');
    }
});

app.post('/applications/:id/accept', async (req, res) => {
    try {
        const { id } = req.params;
        await Employees.findByIdAndUpdate(id, { status: 'Accepted' });
        req.flash('success', 'Application accepted.');
        res.redirect('/applications');
    } catch (error) {
        console.error('Error accepting application:', error);
        req.flash('error', 'Could not accept application.');
        res.redirect('/applications');
    }
});

// Reject an application
app.post('/applications/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        await Employees.findByIdAndUpdate(id, { status: 'Rejected' });
        req.flash('success', 'Application rejected.');
        res.redirect('/applications');
    } catch (error) {
        console.error('Error rejecting application:', error);
        req.flash('error', 'Could not reject application.');
        res.redirect('/applications');
    }
});
//Schedule a interview route 
app.post('/schedule-interview/:applicationId', async (req, res) => {
    const { applicationId } = req.params; // Extract application ID from params
    const { date, mode, location } = req.body; // Extract form data from the request body

    try {
        // Find the employee document using the applicationId
        const employee = await Employees.findById(applicationId);

        if (!employee) {
            console.error("Employee record not found.");
            return res.status(404).json({ error: "Employee record not found." });
        }

        // Ensure required fields for the interview
        if (!employee.jobId || !employee.userId) {
            console.error("Invalid employee data. JobId or UserId is missing.");
            return res.status(400).json({ error: "Invalid employee data." });
        }

        // Update the interview details
        employee.interview = {
            status: "Scheduled", // Set status to 'Scheduled'
            date: date || null, // Ensure date is not undefined
            mode: mode || null, // Validate mode
            location: location || null, // Validate location
        };

        // Save the updated employee document
        await employee.save();

        req.flash('success', 'Interview scheduled successfully.');
        res.redirect('/applications');
    } catch (error) {
        console.error("Error scheduling interview:", error.message);
        req.flash('error', 'Error scheduling interview.');
        res.redirect('/applications');
        res.status(500).json({ error: "Error scheduling interview." });
    }
});
//user dashboard section 
// correect Candidate Dashboard Route

app.get('/dashboard', async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            req.flash('error', 'You must be logged in to view your profile.');
            return res.redirect('/login');
        }

        const applications = await Employees.find({ userId: user._id }).populate('jobId').exec();
        res.render('dashboard', { user, applications });
    } catch (err) {
        console.error('Error fetching user dashboard:', err);
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
app.post("/signup", async (req, res, next) => {
    try {
      const { email, username, password, role } = req.body;
  
      // Assign role based on the form input or default to 'user'
      const newUser = new User({ email, username, role: role || 'user' });
  
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
  });
  
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
  
      // Check if the user is an owner
      if (req.user.role === 'owner') {
        res.locals.isOwner = true;  // Set a local variable for views to check if the user is an owner
      } else {
        res.locals.isOwner = false;
      }
  
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
