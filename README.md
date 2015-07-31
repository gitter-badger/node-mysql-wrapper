# node-mysql-wrapper

This is a node js module which manages mysql (node-mysql) connection and models with a way that you are expecting! 

## Installation

```sh
$ npm install node-mysql-wrapper
```

[NPM] https://www.npmjs.com/package/node-mysql-wrapper

## Usage

```js
var express = require('express');
var app = express();
var httpServer = require('http').createServer(app);
var path = require('path');
var config = require('config');
var dbConfig = require('./config/database.json')[process.env.NODE_ENV || 'development'];
//FIRST TESTS
var mysqlCon = require('./../index')(dbConfig.URL); //"mysql://kataras:pass@127.0.0.1/taglub?debug=false&charset=utf8"



mysqlCon.connect().then(function () {
    //load models

    var user = { userId: 20, mail: 'mail20_updated@omakis.com', username: 'an updated20 username', password: 'a pass', noInDatabaseProperty: 'something else that must NOT shown as column below!' };
    var userTable = mysqlCon.table('users');
    var userModel = userTable.model(user);

    
     console.log("============= try to save==============");
     userModel.save().then(function (userObj) {
         
     });
    
       
     console.log("================ try to delete ===============");
     userModel.delete().then(function (_deleted) {
         console.log("user with username: " + _deleted.username + " just deleted from db");
         delete user;
         delete userModel;
     }, function (err) {
         console.log(err);
     });
    
    console.log("================ try to select by id ===============");
    var findUser = userTable.model({ userId: 16}); //You can use other property rathen than primary key, also you can use more than one property.
    findUser.find().then(function (userObj) {
        console.log('find this user with username: ' + userObj.username);
    }); 
  
});


var httpPort = config.get('Server.port');
httpServer.listen(httpPort, function () {
    console.log("Server is running on " + httpPort);
});

```

## Look at the Examples folder for the full source code.


### [GPL-3.0 Licensed](LICENSE)

[downloads-url]: https://www.npmjs.com/package/node-mysql-wrapper
