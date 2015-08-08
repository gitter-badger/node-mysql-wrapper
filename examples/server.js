var express = require('express');
var app = express();
var httpServer = require('http').createServer(app);
var path = require('path');
var config = require('config');
var dbConfig = require('./config/database.json')[process.env.NODE_ENV || 'development'];

//EXAMPLES AND TESTS BEGIN
//  START OF INIT CONNECTION EXPLAINATION
/* You have 3 options to attach a connection to the wrapper
 * 
 * 1. If you dont have an already mysql connection object do:
 *  1.1 Use object with host,user,password and database,
 *  1.2 Use a connection string as described later.
 * 
 * 2. If you have an already  mysql connection object, connected or no connected do:
 *  2.1 Just pass this object to the wrapper module.
 * 
 * For '1' and for '2' you have always to start/connect/link the module  with mysqlCon.connect() or .link(), they do the same thing.
 * Second parameter:  true means that this is the only one connection in the whole node js project, global variables MySQLTable, MySQLModel and _W will be available to use without help of mysqlCon variable to use tables and create models.
 * Examples to init the connection and wrapper:
 */

/*1.1 
 * var mysqlCon = require('./../index')({
    host     : '127.0.0.1',
    user     : 'kataras',
    password : 'pass',
    database: 'taglub'
},true);
 *1.2
 * var mysqlCon = require('./../index')("mysql://kataras:pass@127.0.0.1/taglub?debug=false&charset=utf8",true);
 *2.1
 *  var mysql = require('mysql');
 *  var originalMySqlConnection = mysql.createConnection("mysql://kataras:pass@127.0.0.1/taglub?debug=false&charset=utf8");
 *  var mysqlCon = require('./../index')(originalMySqlConnection, true); 
 *   //OR
 * originalMySqlConnection.connect().then(function () {
 *  var mysqlCon = require('./../index')(originalMySqlConnection, true);
 * });
 * 
 * after '1' and '2' do always: mysqlCon.link().then(function () { ... your code here });
*/
//  END OF INIT CONNECTION EXPLAINATION

var mysqlCon = require('./../index')("mysql://kataras:pass@127.0.0.1/taglub?debug=false&charset=utf8");



//IF you only want to use only certain tables from your database, and not all of them, do that before the connect:
//mysqlCon.useOnly('users',['comments','comment_likes']); //argument(s) can be array of strings or just string(s).
//END IF

mysqlCon.connect().then(function () { //OR mysqlCon.link().then...
    
    /* First parameter is the mysql string,object or already defined mysql connection object ( conencted or no connected)
     * Second parameter true or false if this is the only one connection in your project (defaults to true)
     * Third parameter true or false , that you can have directly and global access to MySQLModel, MySQLTable and _W (MySQLWrapper) object. (defaults to true)
     * 
     * instead of calling mysqlCon.table('tablename').model({object or criteria}).
     * All methods bellow do the same thing, returns the user which it's user_id equals to 18.
     * _W stands for 'Wrapper', indicates: both of MySQLTable & MySQLTable, returns the correct is a matter of how many arguments you pass on. Look how it works:
    */
    /*
    //TABLE use:
    var userTable = MySQLTable('users');
    //OR
    var userTable = _W('users'); // _W with one parameter/argument means: return MySQLTable with a name of arguments[0]. //yes without 'new' keyword, it will auto find the correct table.
    
    userTable.model({ userId: 18 }).find().then(function (results) {
        console.log('Found with username: ' + results[0].username);
    });
    
    //userTable.model({username : 'username which exists on 4 rows'})... // you can use this table for create more models or criteria filters for find.
    
    //AND MODEL ONLY use: 
    
    var model = new MySQLModel('users', { userId: 18 });
    //OR
    var model = _W('users', { userId: 18 });// _W with two parameters/arguments means: create and return new MySQLModel from table of arguments[0] and object or criteria of arguments[1].
    
    model.find().then(function (results) {
        console.log('Found with username: ' + results[0].username);
    });
    */
    /*END IF */
    
    
    
    /*one to one relation ship if finds only one result. userInfos will be undefined and new property called  'userInfo' stores the row which it's user_id = 18.*/
    //next line  means the value of the primary key of the parent-relationship object.(userId=18) [ the commentId:'=' inside comment's likes doesnt work yet.
    var findUserWithInfo = _W('users', { username: 'a username', userInfos: { userId: '=' }, comments: { userId: '=' } , whateversharedProperty: 'whatever-no db' });
    
    findUserWithInfo.find().then(function (results) {
        if (!results) {
            console.log('didnt find this user');
            return;
        }
        
        console.log('Found ' + results.length + ' users');
        
        for (var i = 0; i < results.length; i++) {
            var _user = results[i];
            console.log('I found the user ' + _user.username + ' with user id ' + _user.userId + (_user.userInfos.length > 0 ? ' which hometown is: ' + _user.userInfos[0].hometown: ''));
            
            if (_user.comments !== undefined && _user.comments.length > 0) {
                for (var j = 0; j < _user.comments.length; j++) {
                    
                    console.log('Comment content: ' + _user.comments[j].content);
                }
            }
        }
   


    });
    
    
    /*   var oneUserToDelete = _W('users', { userId: 16 }).safeDelete().then(function (jsRes) {
        if (jsRes.affectedRows > 0) {
            console.log('deleted');
        }
  
    }); //When you want to delete a row using primary key (safe way), you could also use .delete() for this too, it will do the same thing .
    
    var someUsersToDelete = _W('users', { username: 'usernames to delete' }).delete().then(function (jsRes) { //When you want to delete row(s) without using primary key 
        if (jsRes.affectedRows > 0) {
            console.log(jsRes.affectedRows + ' users with username: ' + jsRes.username + ' have gone :(');
        }
    });
    
    
    var userFactory = require('./modules/user.js');
    userFactory.login("updated18@omakis.com", "a pass").then(function (userFound) {
        console.log("===== USER LOGIN ======");
        console.log('Valid user with ID: ' + userFound.userId + ' and username: ' + userFound.username);
    }, 
    function () {
        console.error('Invalid mail or password!');
    });

    var userModel = _W("users", { username: "an updated x username 1nd time" , mail: "an updated mail for user id x 1st time" });
    //create new user 
    userModel.save().then(function (_newCreatedUser) {
        //update this user
        userModel.save("an updated username for user_id " + userModel.primaryKeyValue + "  or "+ _newCreatedUser.userId+" 2nd time", "an updated mail for user id " + userModel.primaryKeyValue + " 2nd time"); //1st parameter  follows the username, the first parameter of our model except the first which is the primary key userId 18, the second parameter follows the third of our model which is the 'mail' property's value.
  
    });
    
     */
   
 
     //EXTEND the Model:
      MySQLModel.extend("mailExists", function (mail, callback) {//this is a shared custom function extends for all models.
        
        //this =  the caller's MySQLModel, for example this =  the new  MySQLModel("users",{}), where this.table.name = "users", look at the next function.
        this.connection.query("SELECT COUNT(*) FROM " + this.table.name + " WHERE mail = " + this.connection.escape(mail), function (err, results) {
            if (!err && results.length > 0 && results[0]["COUNT(*)"] > 0) {
                callback(true);
            } else {
                callback(false);
            }
        });

    });
    
    //or _W("users",{}).mailExists.... or _W("Whatevermodel",{})
    new MySQLModel("users", {}).mailExists("mail20_updated@omakis.com", function (trueOrFalse) {
        console.log("User mail exists? " + trueOrFalse);
    });
    /* 
    _W("admins", {}).mailExists("mailadmin1@omakis.com", function (trueorfalse) {
        console.log("Admin mail exists? " + trueorfalse);
    });   
    */


    // _W.When example:

    var findAllByUsername = _W("users", { username: 'a username' }).find();
    var findAllLikesFromUserId = _W("comment_likes", { userId: 18 }).find();
    var findAllCommentsFromUserId = _W("comments", { userId: 18 }).find();
    
    _W.when(findAllByUsername, findAllLikesFromUserId,findAllCommentsFromUserId).then(function (_results) {
        
        console.log('find all users with USERNAME results: ');
        console.dir(_results[0]);
        console.log('\n find all LIKES by user id 18 results: ');
        console.dir(_results[1]);
        console.log('\n find all COMMENTS by user id 18 results: ');
        console.dir(_results[2]);
        console.log('\n');
    });


    console.log('\n FIND FULL USER WITH COMMENTS AND THEIR LIKES');
    var userFactory = require('./modules/user.js');
    userFactory.getFullUser(18, function (user) {
        console.log("FOUND the user with username: " + user.username);
        console.log("AND COMMENTS: ");
        
        [].forEach.call(user.comments, function (comment) { 
            console.log(comment.content + " with " + comment.likes.length + " likes");
        });

    
    
    });
});
//END OF EXAMPLES AND TESTS.

var httpPort = 1193;//config.get('Server.port') || 1193;
httpServer.listen(httpPort, function () {
    console.log("Server is running on " + httpPort);
});
