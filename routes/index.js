"use strict";

let express = require('express');
let router = express.Router();
let dataServices = require('../data_services');
let passwordHash = require('password-hash');

/////////////////////////////////////////////////////////
//
// HOME
//
/////////////////////////////////////////////////////////

//
// The "home" page.
//
router.get('/', function(req, res, next) {
   res.render('index'); 
});



/////////////////////////////////////////////////////////
//
// SIGN UP
//
/////////////////////////////////////////////////////////


//
// The "sign up" page.
//
router.get('/signup', function(req, res, next) {
  res.render('signup'); 
});

//
// The POST route for signing up. This creates a new user.
//
router.post('/signup', function(req, res, next) {

    let userId = req.body.userId;
    let password = req.body.password;
    let hashedPassword = passwordHash.generate(password);

    let userData = {
        userId:req.body.userId,
        password:passwordHash.generate(req.body.password),
        firstName:req.body.firstName,
        lastName:req.body.lastName,
        gender:req.body.mysex,
        age:req.body.age,
        religion:req.body.myreligion,
        avatarImage:req.body.avatarimage,
        minPreferredAge:req.body.minPreferredAge,
        maxPreferredAge:req.body.maxPreferredAge,
        preferredReligion:req.body.preferredReligion,
        preferredGender:req.body.preferredGender,
    }

    //
    // Try to get the user from the db. If they exist, don't let a new user with that same
    // user id register.
    //
    dataServices.getUser(userData.userId).then(function(user) {
        if ( user ) {
           res.redirect('userexists'); 
        } else {

            //
            // Now we create a new user in the database. Once we're done, we redirect the user
            // to people who match their desired search criteria.
            //
            dataServices.createNewUser(userData).then(function(dbUser) {
                req.session.loggedInUserId = dbUser.id;
                res.redirect('matches'); 
            }).catch( (err) => { next(err); });

           
        }
    }).catch( (err) => { next(err); });

});

//
// Uh oh! Someone tried to sign up with an id that is already being used.
//
router.get('/userexists', function(req, res, next) {
  res.render('userexists'); 
});



/////////////////////////////////////////////////////////
//
// LOG IN
//
/////////////////////////////////////////////////////////


//
// The "log in" page.
//
router.get('/login', function(req, res, next) {
  res.render('login'); 
});

//
// The POST route for logging in.
//
router.post('/login', function(req, res, next) {
    let userId = req.body.userId;
    let password = req.body.password;
    
    //
    // Does the user exist? And does the user's password in the database match the password entered
    // in the web form?
    //
    dataServices.getUser(userId).then(function(user) {

        //
        // If the user exists and the password is correct, redirect the user's browser to ideal matching date/mates.
        //
        if ( user && passwordHash.verify(password, user.password) ) {
            req.session.loggedInUserId = user.id;
            res.redirect('matches'); 
        } else {
            res.redirect('loginerror'); 
        }
    }).catch( (err) => { next(err); });
});

//
// Uh oh! Error logging in.
//
router.get('/loginerror', function(req, res, next) {
  res.render('loginerror'); 
});



/////////////////////////////////////////////////////////
//
// VIEW MATCHES
//
/////////////////////////////////////////////////////////


router.get('/matches', function(req, res, next) {

    //
    // Don't allow the user to access this page if they aren't logged in.
    // BETTER: Should have added this check to a middleware, but trying to get this coded fast, so
    // this is ok for now!
    //
    if (!res.locals.loggedInUser) {
        res.redirect('login');
    } else {

        //
        // Grab people (boys or girls) that match the logged-in user's ideal match criteria. Only show
        // up to 5 matches.
        //
        dataServices.getMatches(res.locals.loggedInUser.id,res.locals.loggedInUser.preferred_gender,
            res.locals.loggedInUser.preferred_religion, res.locals.loggedInUser.min_preferred_age,
            res.locals.loggedInUser.max_preferred_age).then(function(users) {
                users.length = Math.min(users.length,5);
                res.render('matches',{users:users}); 
        }).catch( (err) => { next(err); });        
    }
});

module.exports = router;
