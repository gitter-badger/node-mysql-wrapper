# node-mysql-wrapper

This is a node js module which manages mysql (node-mysql) connection and models with a way that you are expecting! 

## Installation

```sh
$ npm install node-mysql-wrapper
```

[NPM] https://www.npmjs.com/package/node-mysql-wrapper

## Usage
### server.js
```js
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

var mysqlCon = require('node-mysql-wrapper')("mysql://kataras:pass@127.0.0.1/taglub?debug=false&charset=utf8", true);



//IF you only want to use only certain tables from your database, and not all of them, do that before the connect:
//mysqlCon.useOnly('users',['comments','comment_likes']); //argument(s) can be array of strings or just string(s).
//END IF

mysqlCon.connect().then(function () { //OR mysqlCon.link().then...
    
    /* IF and only IF you pass the second parameter as 'true' on mysqlCon, you can have directly and global access to MySQLModel and MySQLTable objects, 
     * instead of calling mysqlCon.table('tablename').model({object or criteria}).
     * All methods bellow do the same thing, returns the user which it's user_id equals to 18.
     * _W stands for 'Wrapper', indicates: both of MySQLTable & MySQLTable, returns the correct is a matter of how many arguments you pass on. Look how it works:
    */

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
    
    /*END IF */
    
    var userTable = mysqlCon.table('users');
    
    /*one to one relation ship if finds only one result. userInfos will be undefined and new property called  'userInfo' stores the row which it's user_id = 18.*/
    //next line  means the value of the primary key of the parent-relationship object.(userId=18) [ the commentId:'=' inside comment's likes doesnt work yet.
    var findUserWithInfo = userTable.model({ username: 'a username', userInfos: { userId: '=' }, comments: { userId: '=' } , whateversharedProperty: 'whatever-no db' });
    
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
    
    
    var oneUserToDelete = userTable.model({ userId: 16 }).safeDelete().then(function (jsRes) {
        if (jsRes.affectedRows > 0) {
            console.log('deleted');
        }
  
    }); //When you want to delete a row using primary key (safe way), you could also use .delete() for this too, it will do the same thing .
    
    var someUsersToDelete = userTable.model({ username: 'usernames to delete' }).delete().then(function (jsRes) { //When you want to delete row(s) without using primary key 
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

});
//END OF EXAMPLES AND TESTS.

var httpPort = 1193;//config.get('Server.port') || 1193;
httpServer.listen(httpPort, function () {
    console.log("Server is running on " + httpPort);
});


```
### /modules/user.js
```js
var Promise = require('bluebird');
//you are seeing well, no need of require the node-mysql-wrapper, because you pass a 'true' on the second parameter on server.js

var User = function(){
    
};

User.prototype.login = function (mail, password) {
    var def = Promise.defer();

    _W('users', { mail: mail, password: password }).find().then(function (results) {
        if (results.length > 0) {
            def.resolve(results[0]);
        } else {
            def.reject();
        }
    });

    return def.promise;
};
 //OR
User.prototype.login2 = function (mail, password) {
    var def = Promise.defer();
    var userTable = new MySQLTable('users');
    userTable.model({ mail: mail, password: password }).find().then(function (results) {
        if (results.length > 0) {
            def.resolve(results[0]);
        } else {
            def.reject();
        }
    });
    
    return def.promise;
};



module.exports = new User();

```

## Look at the Examples folder for the full source code.


### [GPL-3.0 Licensed](LICENSE)

[downloads-url]: https://www.npmjs.com/package/node-mysql-wrapper
