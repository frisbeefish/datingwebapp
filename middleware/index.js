"use strict";

let dataServices = require('../data_services');

module.exports = {

    //
    // This middleware will magically init the database if it doesn't currently exist.
    // Initializing the database includes creating it, creating table(s), and populating the database with
    // 300 fake users.
    //
    ensureDataseExists(req,res,next) {
        dataServices.initDatabase().then(() => {
            next();
        });
    },

    //
    // This middleware looks at the session's "loggedInUserId" value. If that value exists, this will go out
    // to the database and load the user whose id is in the "loggedInUserId" session variable. This function then
    // loads that user into the current response's "locals" hash/map.
    //
    // Since this middleware is called before any routes, it will ensure that if the user is logged in, the
    // "res.locals.loggedInUser" object contains a reference to that user's data (from the database). This allows
    // routes that need to grab logged-in-user-specific data from the database to do so.
    //
    loadLoggedInUser(req,res,next) {
        if (!req.session.loggedInUserId) {
            next();
        } else {
            dataServices.getUserByRowId(parseInt(req.session.loggedInUserId)).then(function(user) {
                if ( user ) {
                    res.locals.loggedInUser = user;
                    next();
                } else {
                    next(new Error('Invalid logged in user')); 
                }
            }).catch( (err) => { next(err); });

        }
    }
    
}