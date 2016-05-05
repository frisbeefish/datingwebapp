"use strict";

let fs = require("fs");
let sqlite3 = require("sqlite3").verbose();
let file = "test.db";

//
// Create some fake users for registered users to date.
//
function generateRandomUsers () {

    const SEX = ['Male','Female'];
    const RELIGION = ['Christian','Jewish','Other'];
    const FEMALE_NAMES = ['Susan','Cindy','Ally','Brianne','Kristen','Hillary'];
    const MALE_NAMES = ['Brad','John','Jeff','Chris','Ted','Doug','Jordan'];
    const LAST_NAMES = ['Aames','Carruthers','Evans','Fredricks','Hamson','Jones','Richards','Sachs'];

    let users = [];

    function getRandomArbitrary(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }

    for (let i = 0; i < 300; i++) {
        let age = getRandomArbitrary(20,51);
       
        let gender = SEX[getRandomArbitrary(0,SEX.length)];
        
        let religion = RELIGION[getRandomArbitrary(0,RELIGION.length)];
        let firstName = gender === 'Male' 
           ? MALE_NAMES[getRandomArbitrary(0,MALE_NAMES.length)] 
           : FEMALE_NAMES[getRandomArbitrary(0,FEMALE_NAMES.length)] 
        let lastName = LAST_NAMES[getRandomArbitrary(0,LAST_NAMES.length)];

        let number = getRandomArbitrary(1,6);
        let fileBase = gender === 'Male' ? 'man' : 'girl';
        let avatarImage = `images/${fileBase}${number}.png`;

        users.push({
            userId:'neverguessthis@foo.bar',
            password:'sha1$835a8459$1$23c596cbae62d7fa79b7f37d4c90fb8f963a8cfb', // 'asdf'
            firstName,
            lastName,
            gender,
            age,
            religion,
            avatarImage,
            minPreferredAge:age,
            maxPreferredAge:age,
            preferredReligion:religion,
            preferredGender:gender
        });
    }    

    return users;
}


module.exports = {

    //
    // This is a NOOP unless the database hasn't been created and filled with fake users yet. If the database doesn't
    // yet exist, this function will create it.
    //
    // Return: a promise.
    //
    initDatabase() {

        return new Promise( function (resolve,reject) {

           var exists = fs.existsSync(file);
           var db = new sqlite3.Database(file);

           if (exists) {
              return process.nextTick(_ => resolve());
           } else {
              console.log("Creating DB file.");
              fs.openSync(file, "w");
           }

           db.serialize(function() {

              let createTableSql = 
                 `create table user(
                     id INTEGER PRIMARY KEY,
                     user_id TEXT,
                     password TEXT,
                     first_name TEXT,
                     last_name TEXT,
                     gender TEXT,
                     age INTEGER,
                     religion TEXT,
                     avatar_image TEXT,
                     min_preferred_age INTEGER,
                     max_preferred_age INTEGER,
                     preferred_religion TEXT,
                     preferred_gender TEXT
                  )`;

              db.run(createTableSql); 
          
              let insertRowSql = 
                 `INSERT INTO user 
                  VALUES(
                     ?,?,?,?,?,?,
                     ?,?,?,?,?,?,?
                  )`;

              var stmt = db.prepare(insertRowSql); 
          
              let users = generateRandomUsers();

              users.forEach((user) => {
                  stmt.run(null,
                    user.userId,
                    user.password,
                    user.firstName,
                    user.lastName,
                    user.gender,
                    user.age,
                    user.religion,
                    user.avatarImage,
                    user.minPreferredAge,
                    user.maxPreferredAge,
                    user.preferredReligion,
                    user.preferredGender
                 );
              });
              stmt.finalize();

              //
              // Debug, dump the newly created fake users.
              //
              db.each("SELECT * FROM user", function(err, row) {
                 console.log(row.id + ": " + row.first_name + ' ' + row.last_name);
              });

              //
              // Hack. Only way I could think of (without wasting time) to be able to call "resolve" at the right time.
              //
              db.each("SELECT * from user LIMIT 1", function(err, row) {
                 resolve();
              });
           });

           db.close();
        });     
    },


    //
    // Create a new user in the database.
    //
    // Return: a promise. The "resolve" function will be passed the newly created user object.
    //
    createNewUser(user) {

        console.log('CREATE USER WITH USER: ' + user);

        return new Promise( function (resolve,reject) {

           var db = new sqlite3.Database(file);

           db.serialize(function() {
          
              let insertRowSql = 
                 `INSERT INTO user 
                  VALUES(
                     ?,?,?,?,?,?,
                     ?,?,?,?,?,?,?
                  )`;

              var stmt = db.prepare(insertRowSql); 
          
              let users = generateRandomUsers();
              
              stmt.run(null,
                user.userId,
                user.password,
                user.firstName,
                user.lastName,
                user.gender,
                user.age,
                user.religion,
                user.avatarImage,
                user.minPreferredAge,
                user.maxPreferredAge,
                user.preferredReligion,
                user.preferredGender
             );
             
              stmt.finalize();

               let sql = 
                 `SELECT * FROM user 
                  WHERE user_id="${user.userId}"
                  LIMIT 1`;

               db.all(sql,function(err,rows) {
                  if (err) {
                     reject(err);
                  } else {
                     resolve(rows.length > 0 ? rows[0] : null);
                  }
               });


           });

           db.close();
        });     
    },


    //
    // Get all people that match the desired search criteria. Make sure not to include the logged in user
    // in that search.
    //
    // Return: a promise. The "resolve" function will be passed a list of matching "user" objects from the database.
    //
    getMatches(loggedInUserId, gender, religion, minAge, maxAge) {


        return new Promise( function (resolve,reject) {
           let db = new sqlite3.Database(file);

           let sql = 
             `SELECT * FROM user 
              WHERE gender="${gender}"
              AND religion="${religion}"
              AND age >= ${minAge}
              AND age <= ${maxAge}
              AND id != ${loggedInUserId}
              LIMIT 10`;

           db.all(sql,function(err,rows) {
              if (err) {
                 reject(err);
              } else {
                 resolve(rows);
              }
           });

           db.close();
        });
    },

    //
    // Get the user by their id (an email address).
    //
    // Return: a promise. The "resolve" function will be passed the matching user or null - if the user doesn't exist.
    //
    getUser(userId) {
        return new Promise( function (resolve,reject) {
           let db = new sqlite3.Database(file);

           let sql = 
             `SELECT * FROM user 
              WHERE user_id="${userId}"
              LIMIT 1`;

           db.all(sql,function(err,rows) {
              if (err) {
                 reject(err);
              } else {
                 resolve(rows.length > 0 ? rows[0] : null);
              }
           });

           db.close();
        });
    },

    //
    // Get the user by their database row id.
    //
    // Return: a promise. The "resolve" function will be passed the matching user or null - if the user doesn't exist.
    //
    getUserByRowId(id) {
        return new Promise( function (resolve,reject) {
           let db = new sqlite3.Database(file);

           let sql = 
             `SELECT * FROM user 
              WHERE id="${id}"
              LIMIT 1`;

           db.all(sql,function(err,rows) {
              if (err) {
                 reject(err);
              } else {
                 resolve(rows.length > 0 ? rows[0] : null);
              }
           });

           db.close();
        });

    }
}