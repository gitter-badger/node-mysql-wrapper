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
require('node-mysql-wrapper'); /*just require it,  'MySQLConnection && MySQLModel' classes/objects will be globaly available.*/
var mysqlCon = new MySQLConnection(dbConfig.URL);
mysqlCon.setTables('./modules/tables.json');

mysqlCon.connect().then(function () {
    //load models
  
    var user = {userId:1 , username: 'a username', password: ' a pass',createdDate : '27/07/2015',noInDatabaseProperty:'something else that must NOT shown as column below!'};
    /*var userModel = new MySQLModel(user, 'users',mysqlCon); or*/
    var userModel = mysqlCon.createModel(user, 'users');
    console.log('Columns of this user: ' + userModel.columns + ' values: ' + userModel.values + ' table name: ' + userModel.table);
});


var httpPort = config.get('Server.port');
httpServer.listen(httpPort, function() {
  console.log("Server is running on " + httpPort);
});


```

## Look at the Examples folder for the full source code.


### [GPL-3.0 Licensed](LICENSE)

[downloads-url]: https://www.npmjs.com/package/node-mysql-wrapper
