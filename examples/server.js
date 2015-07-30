var express = require('express');
var app = express();
var httpServer = require('http').createServer(app);
var path = require('path');
var config = require('config');
var dbConfig = require('./config/database.json')[process.env.NODE_ENV || 'development'];
//FIRST TESTS
var mysqlCon = require('./../index')(dbConfig.URL);



mysqlCon.connect().then(function () {
    //load models

    var user = { userId: 0, mail: 'mail17@omakis.com', username: 'an updated17 username', password: 'a pass', noInDatabaseProperty: 'something else that must NOT shown as column below!' };
    var userTable = mysqlCon.table('users');
    var userModel = userTable.model(user);

    console.log('Columns of this user: ' + userModel.table.columns + ' \nValues: ' + userModel.values + ' \ntable name: ' + userModel.table.name);

    /* console.log("============= try to save==============");
     userModel.save().then(function (_user) {
         console.log(user.userId + " from call back is the same object: " + _user.userId);
     });
       
     console.log("================ try to delete ===============");
     userModel.delete().then(function (_deleted) {
         console.log("user with username: " + _deleted.username + " just deleted from db");
         delete user;
         delete userModel;
     }, function (err) {
         console.log(err);
     });
      */

});


var httpPort = config.get('Server.port');
httpServer.listen(httpPort, function () {
    console.log("Server is running on " + httpPort);
});
