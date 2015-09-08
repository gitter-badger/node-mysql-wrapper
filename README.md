# node-mysql-wrapper

[![NPM Version][npm-image]][npm-url]
[![Node.js Version][node-version-image]][node-version-url]


## Table of Contents


- [Install](#install)
- [Introduction](#introduction)
- [Contributors](#contributors)
- [Community](#community)
- [Establishing connections](#establishing-connections)
- [Connection options](#connection-options)
- [Terminating connections](#terminating-connections)
- [Tables](#tables)
- [Performing queries](#performing-queries)
- [Table events](#table-events)
- [Extending a table](#extending-a-table)
- [Running tests](#running-tests)
- [Todo](#todo)

## Install

```sh
$ npm install node-mysql-wrapper
```

Sometimes I may also ask you to install the latest version from Github to check
if a bugfix is working. In this case, please do:

```sh
$ npm install kataras/node-mysql-wrapper
```

## Introduction

This is a node.js wrapper for node-mysql driver package. It is written in TypeScript, does not
require compiling (all JavaScript files you need are inside the 'compiled' folder)  and is 100% GPL-3.0 licensed.

Here is an example on how to use it:

```js
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'me',
  password : 'secret',
  database : 'my_db'
});

var wrapper = require('node-mysql-wrapper');
var db = wrapper.wrap(connection);
//or (without need of require mysql module) ->
//var db = wrapper.wrap("mysql://user:pass@127.0.0.1/databaseName?debug=false&charset=utf8");

db.ready(function(){
	//your code goes here	
	//users -> an example table inside the database, just call it like property:

	db.table("users").findById(8,function(user){
	    console.dir(user);

		//to destroy the whole connection, its events and its tables use: 
		db.destroy();
	
    }); //or using promises: findById(8).then(function(rowResults){...});
    

});
```

From this example, you can learn the following:

* Every method you invoke on a table is queued and executed in asynchronous way, using callbacks and/or promises.
* Closing the connection is done using `destroy()` which makes sure all remaining
  queries are executed before sending a quit packet to the mysql server.

## Contributors

Thanks goes to the people who have contributed code to this module, see the
[GitHub Contributors page][].

[GitHub Contributors page]: https://github.com/kataras/node-mysql-wrapper/graphs/contributors



## Community

If you'd like to discuss this module, or ask questions about it, please use one
of the following:

* **Mailing list**: https://groups.google.com/forum/#!forum/node-mysql-wrapper
* **IRC Channel**: http://irc.lc/freenode/node-mysql-wrapper/ 

## Establishing connections

The recommended way to establish a wrapped-connection is this:

```js
var wrapper =  require('node-mysql-wrapper');
var db = wrapper.wrap("mysql://user:pass@127.0.0.1/databaseName?debug=false&charset=utf8");

db.ready(function(){ 

});
```

However, a wrapped-connection can also be implicitly established by wrapping an existing mysql connection:

```js
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'me',
  password : 'secret',
  database : 'my_db'
});

var wrapper =  require('node-mysql-wrapper');
var db = wrapper.wrap(connection);

db.ready(function(){

});
```

Depending on how you like to code, either method may be
appropriate. But in order to works  always use .ready and a callback inside it.

## Connection options

Read them at the [node-mysql module](https://github.com/felixge/node-mysql/#connection-options) documentation



## Terminating connections

There are two ways to end a connection. Terminating a connection gracefully is
done by calling the `end()` method:

```js
db.end(function(err) {
  // The connection, table events and queries are terminated now
}); 
//Surely you can have a direct access to mysql connection from db.connection object, if you ever need it.
```

This will make sure all previously enqueued queries are still before sending a
`COM_QUIT` packet to the MySQL server. If a fatal error occurs before the
`COM_QUIT` packet can be sent, an `err` argument will be provided to the
callback, but the connection will be terminated regardless of that.

An alternative way to end the connection is to call the `destroy()` method.
This will cause an immediate termination of the underlying socket.
Additionally `destroy()` guarantees that no more events or callbacks will be
triggered for the connection.

```js
db.destroy();
```

Unlike `end()` the `destroy()` method does not take a callback argument.


## Tables

### Manual select which tables you want to use. (default all)

```js
 db.useOnly('users','comments',['or_an_array_of_tables','comment_likes']);
 //this goes before db.ready function.
```

### Getting a table object
```js
//all code you will see bellow goes inside db.ready(function () { //code here });
var usersTable = db.table("users"); //yes, just this :)
console.log('available columns: '+ usersTable.columns);
console.log('primary key column name: '+ usersTable.primaryKey);
console.log('find, findById, findAll, save and remove methods can be called from this table');

usersTable.find({mail:'makis@omakis.com'},function(results){

});

```
## Performing queries 

### Method queries

They are 4 types of method queries, the find/findById/findSingle,findAll (select), save (insert or update), remove. All values you pass there are auto-escaped to protect the database from sql injections.

All methods return promises.
 
Column keys are auto converted to object properties, this means that user_id column on database table will be available as userId, same for table names too.

**Simple 'find by id' method** , this find method always returns  one result.
```js
db.table("users").findById(18,function(user){
	console.log("SELECT * FROM users WHERE user_id = 18");
	console.dir(user);
});
```
**Simple 'find single' method** , this find method always returns  one result.
```js
db.table("users").findSingle({mail:'makis@ideopod.com'},function(user){
	console.log("SELECT * FROM users WHERE mail = 'makis@ideopod.com' LIMIT 1");
	console.dir(user);
});
```
**Simple 'find by' method** this find method always returns an array.
```js
db.table("users").find({yearsOld:22},function(users){
	console.log("SELECT * FROM users WHERE yearsOld = 22. results: ";
	console.dir(users);
});
```

**Simple 'find all' method** , which is the same as db.table("tablename").find({},callback); or .find({ tableRules : { limit :42 }} if rules passed.
```js
db.table("users").findAll({limit :42}).then(function(users){ 
	console.log("SELECT * FROM users LIMIT 42. results: ");
	console.dir(users);
});
```

**An 'advanced  find' method**. Find all users where years_old = 22, find the user's info, find user's comments, the comment's likes and users who liked them.
```js
var dbUsers = db.table("users");

var criteria = dbUsers.criteria
.where("yearsOld",22)
.joinAs("info","userInfos","userId").at("info").limit(1) 
//with.at('tableOrPropertyName') we are going and passing criterias inside the info property
//this will pass the the result as object not as array, because of limit(1)
.parent() // or .original() here will be redirect to parent object, ( user(s) table) to continue our query...
//original() goes to the first-original-primary table, parent() goes to the parent table, you can have unlimited .at('joinedTableOrProperty') functions.
.join("comments","userId")
.at("comments")
.orderBy("commentId",true) //true if you want desceding ( ORDER BY COLUMN_KEY DESC )
.joinAs("likes","commentLikes","commentId")
.at("likes")
.joinAs("likers","users","userId").build(); 
//In order to go to parent table use : parent(),
//to go to primary-first-iriginal table use .original(),
//.build() builds all in correct order so you don't need to call parent() in this case. 

// .build() makes that : 
/*
var criteria= {
	yearsOld:22, //where
	info : {  //joined table
		userId : '=' , //'=' means: put the parent object's property's value.
		tableRules: {
			table:'userInfos',
			limit:1
		}
	},
	comments: { //another joined table with it's own joined tables also
		userId: '=',
		
		tableRules:{
		    orderByDesc: "commentId" //ORDER BY comment_id DESC
		},
		
		likes: {
		    commentId: '=', //foreign key is comment_id. Where it's value is from comment object's primary key's value.
			
			tableRules{ //NEW 
				table: "commentLikes" //use commentLikes tables as 'likes' property
			}
		
			users: {
				userId : '=' 
			}
		} 
	}
};
*/

dbUsers.find(criteria,function(results){
	console.log('A lot of queries executed here, you can guess them :)');
	console.dir(results);
});
```

**Save method**,  Returns a single object, also updates the variable you pass into.
```js

var newUser = { username: 'a new user', yearsOld: 23, mail: 'newmail@mail.com' };

db.table("users").save(newUser).then(function(result){ //if you want use a promise
	console.log('New user just created, new userId:'
	+ result.userId+ ' which is the same as newUser.userId now:' +newUser.userId);
		
	result.username = 'an updated new username';	
	
	db.table("users").save(result,function(){
		console.log('User was just updated, because we have already a primary key setted at this object');
		
	});
		
});


```

**Remove method .1**

```js
//remove/delete all rows from users table where years_old = 22
db.table("users").remove({yearsOld:22},function(resultAnswer){
	console.log(resultAnswer.affectedRows+ ' rows removed from '+resultAnswer.table);
});
```

**Remove method .2** remove by id also

```js
//remove/delete a single row by its primary key
db.table("users").remove(4,function(results){
	console.log('we were just deleted a user with userId(user_id) = 4');
});
```



Also you can **wait for multiple query methods to finish** before you do something using db.when method:

```js
var findAUser = db.table("users").findById(16);
var findMoreUsers = db.table("users").find({username: 'a username'});
var findSomeComments = db.table("comments").find({userId:16});

//you can pass an array of promises too.
db.when(findAUser,findMoreUsers,findSomeComments).then(function(results) {
	/*
results -> results[0] -> findAUser (one object) , results[1]->findMoreUsers (array) results  , results[2] ->findSomeComments (array) results.
	*/

});
```

### Plain queries - the module's purpose is to never need to use this way.
To perform a plain custom query  call the `.query()` method on a wrapped-db  object.

The simplest form of .`query()` is `.query(sqlString, callback)`, where a SQL string
is the first argument and the second is a callback:

```js
db.query('SELECT * FROM `users` WHERE `user_id` = 18', function (error, results) {
  // error will be an Error if one occurred during the query
  // results will contain the results of the query
});
```
( to escape a value here just use db.connection.escape(value) )

## Table events

### on /watch

Each method/query will emit a `table` event when a new type of query executed and parsed. 
If you need to log or test results on the table before it gets used, you can
listen to these events: insert, update, remove (or delete) and save( for both insert and update) .

Note: Events are always executed before callbacks or promises.

```js
//users -> an example table on a database, call it like a normal function
var usersInsertWatcher = function(parsedInsertedRows){
	console.log('Somewhere an insert query executed on USERS table : ');
	console.dir(parsedInsertedRows);
};

var usersRemoveWatcher = function(deleted){
	console.log('Somewhere a remove/delete query executed on USERS table : ');
	console.log('Affected rows number: '+ deleted.affectedRows);
};

db.table("users").on('insert',usersInsertWatcher);
db.table("users").on('remove',usersRemoveWatcher); //and so on...
```

### off /unwatch

To turn off an event on a table just call db.table("tablename").off('event_type',the_callback_variable_to_remove)

```js
db.table("users").off('insert',usersInsertWatcher);
db.table("users").off('remove',usersRemoveWatcher);
```

## Extending a table

Any table can be extending to your own custom needs, with custom method queries, using this syndax:

### db.table("tablename").extend('functionName',theFunction);

An example is always better, let's suppose that we have a users table with some columns, one of these columns is the 'mail' column, and we want to find if a user  exists with a mail in our users table. Ofcourse we could use the already find method, but just for example purpose: 
```js

if(db.table("users").has('mailExists') === false) //not necessary
{
	db.table("users").extend('mailExists',function(mail,callback){
	//this = the users table, so this.name = 'users'
	var q= "SELECT COUNT(*) FROM " + this.name + " WHERE mail = " + 
	db.connection.escape(mail);
		
		db.query(q, function (err, results) {
            if (!err && results.length > 0 && results[0]["COUNT(*)"] > 0) {
                 callback(true);
                } else {
                  callback(false);
            }
       });
	});

}
```

### Use an extended method is simple
```js
	db.table("users").mailExists('an_e-mail@mail.com',function(exists){
		if(exists) console.log('this mail already exists!');
		else console.log('this mail doesnt exists.');
	});
```
## Running tests

### Import this database example to your local server, and have fan!
```sql

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for comments
-- ----------------------------
DROP TABLE IF EXISTS `comments`;
CREATE TABLE `comments` (
  `comment_id` int(11) NOT NULL AUTO_INCREMENT,
  `content` varchar(255) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`comment_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of comments
-- ----------------------------
INSERT INTO `comments` VALUES ('1', 'dsadsadsa', '18');
INSERT INTO `comments` VALUES ('2', 'wqewqewqeq', '18');
INSERT INTO `comments` VALUES ('3', 'cxxzczxczcz', '22');
INSERT INTO `comments` VALUES ('4', 'e comment belongs to 23 usersa', '23');

-- ----------------------------
-- Table structure for comment_likes
-- ----------------------------
DROP TABLE IF EXISTS `comment_likes`;
CREATE TABLE `comment_likes` (
  `comment_like_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `comment_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`comment_like_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of comment_likes
-- ----------------------------
INSERT INTO `comment_likes` VALUES ('1', '18', '1');
INSERT INTO `comment_likes` VALUES ('3', '18', '2');
INSERT INTO `comment_likes` VALUES ('4', '12', '1');
INSERT INTO `comment_likes` VALUES ('5', '16', '3');
INSERT INTO `comment_likes` VALUES ('6', '18', '4');
INSERT INTO `comment_likes` VALUES ('7', '16', '4');
INSERT INTO `comment_likes` VALUES ('8', '16', '3');
INSERT INTO `comment_likes` VALUES ('9', '18', '3');

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `mail` varchar(255) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `created_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `years_old` int(11) DEFAULT '0',
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5624 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES ('16', 'an updated username for user_id 30  or 30 2nd time', 'an updated x username 1nd time', 'ewqeq', '2015-08-09 03:55:34', '21');
INSERT INTO `users` VALUES ('18', 'an updated mail for user id 18 2nd time', 'an updated username for user_id 18 3rd time', 'a pass', '2015-08-08 22:58:49', '55');
INSERT INTO `users` VALUES ('19', 'updated19@omakis.com', 'an 19 username', 'a pass', '2015-08-08 22:38:19', '22');
INSERT INTO `users` VALUES ('20', 'mail20_updated@omakis.com', 'an updated20 username', 'a pass', '2015-08-08 22:58:48', '15');
INSERT INTO `users` VALUES ('22', 'mail22@omakis.com', 'a username', 'a passing', '2015-08-08 22:38:13', '22');
INSERT INTO `users` VALUES ('23', 'mailwtf@dsadsa.com', 'a username', 'pass', '2015-08-08 22:38:16', '22');
INSERT INTO `users` VALUES ('28', 'an updated username for user_id 28  or 283rd time', 'an updated x username 2nd time', 'ewqewq', '2015-08-08 22:58:44', '15');
INSERT INTO `users` VALUES ('31', 'an updated username for user_id 31  or 31 2nd time', 'an updated x username 1nd time', 'dsadsada', '2015-08-09 03:55:32', '0');
INSERT INTO `users` VALUES ('5618', 'special@email.com', 'a special username', null, '2015-08-13 06:32:07', '23');

-- ----------------------------
-- Table structure for user_infos
-- ----------------------------
DROP TABLE IF EXISTS `user_infos`;
CREATE TABLE `user_infos` (
  `user_info_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `hometown` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`user_info_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of user_infos
-- ----------------------------
INSERT INTO `user_infos` VALUES ('1', '18', 'athens');
INSERT INTO `user_infos` VALUES ('3', '22', '22 user hometown');
INSERT INTO `user_infos` VALUES ('4', '23', '23 user hometown');

```



## Todo
*  Waiting for stable yield/*async support

[npm-image]: https://img.shields.io/npm/v/node-mysql-wrapper.svg
[npm-url]: https://npmjs.org/package/node-mysql-wrapper
[node-version-image]: http://img.shields.io/node/v/mysql.svg
[node-version-url]: http://nodejs.org/download/
[travis-image]: https://img.shields.io/travis/kataras/node-mysql-wrapper/master.svg?label=linux
[downloads-url]: https://npmjs.org/package/node-mysql-wrapper
