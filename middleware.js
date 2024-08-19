module.exports.saveRedUrl = (req, res, next)=>{
    if(req.session.redirectUrl){
    res.locals.redirectUrl = req.session.redirectUrl; // saving curr urr/path of user in locals
    }
    next();
}

// middleware.js
module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "You must be signed in first!");
        return res.redirect("/login");
    }
    next();
};
