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
    
    /*
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
    var findUser = userTable.model({ userId: 18}); //You can use other property rathen than primary key, also you can use more than one property.
    findUser.find().then(function (results) {
      
        var userObj = results[0];
        console.log('find this user with username: ' + userObj.username);
    }); 
    /
    console.log("================ try to select multi rows by username ===============");
    var findUsers = userTable.model({ username: "a username" });
    findUsers.find().then(function (users) {
        if (!users) {
            console.log('I cannot find anything....');
            return;
        }


        [].forEach.call(users, function (_user) {
            console.log('found: ' + _user.username + " with id: " + _user.userId);
        });


    });
*/

    /*one-to-many(or many-to-many) , comments will be converted to list*/
    /* var findUserWithComments = userTable.model({ userId: 18, comments: { userId: 18 } });
     findUserWithComments.find().then(function (results) {
         if (!results) {
             console.log('didnt find this user');
             return;
         }
         var _user = results[0];
         console.log('I found the user ' + _user.username + ' with ' + _user.comments.length + ' comments: ');
         for (var i = 0; i < _user.comments.length; i++) {
             console.log('Comment content: ' + _user.comments[i].content);
         }
     });*/

    /*one to one relation ship if finds only one result. userInfos will be undefined and new property called  'userInfo' stores the row which it's user_id = 18.*/
    //next line  means the value of the primary key of the parent-relationship object.(userId=18) [ the commentId:'=' inside comment's likes doesnt work yet.
   var findUserWithInfo = userTable.model({ userId: 18, userInfos: { userId: '=' }, comments: { userId: '=' , likes: { commentId: '=' } } });
    
    findUserWithInfo.find().then(function (results) {
        if (!results) {
            console.log('didnt find this user');
            return;
        }
        var _user = results[0];
        //console.dir(_user);
        console.log('I found the user ' + _user.username + ' with user info id ' + _user.userInfo.userInfoId + ' which hometown is: ' + _user.userInfo.hometown);
        
        if (_user.comments !== undefined && _user.comments.length > 0) {
            if (_user.comments.likes) {
                console.log('some likes too with size of ' + _user.comments.likes.length);
            }
            console.log('I found comments too, with contents!');
            for (var i = 0; i < _user.comments.length; i++) {
                console.log('Comment content: ' + _user.comments[i].content);
            }
        }


    });

    /*[greek(for me)] prepei na kanw kai ta likes, alla to provlima einai an exw
     *  userTable.model({ userId: 18, userInfos: { userId: 18 }, comments: { userId: 18 , likes: {commentId: poio? prepei na exw px ena ? gia na sindeete me to primary key tou jsObject,
     * i na to kanw me commentId: 'commentId' i commentId : '?' 9a dw pws 9a to kanw...}} });
       */


});


var httpPort = config.get('Server.port') || 1193;
httpServer.listen(httpPort, function () {
    console.log("Server is running on " + httpPort);
});
