var express = require('express');
var app = express();
var httpServer = require('http').createServer(app);
var path = require('path');
var config = require('config');
var dbConfig = require('./config/database.json')[process.env.NODE_ENV || 'development'];
//FIRST TESTS
var mysqlCon = require('./../index')(dbConfig.URL); //"mysql://kataras:pass@127.0.0.1/taglub?debug=false&charset=utf8"



mysqlCon.connect().then(function () {
    
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

    /*[greek(for me)] prepei na kanw kai ta likes, alla to provlima einai an exw
     *  userTable.model({ userId: 18, userInfos: { userId: 18 }, comments: { userId: 18 , likes: {commentId: poio? prepei na exw px ena ? gia na sindeete me to primary key tou jsObject,
     * i na to kanw me commentId: 'commentId' i commentId : '?' 9a dw pws 9a to kanw...}} });
       */


});


var httpPort = 1193;//config.get('Server.port') || 1193;
httpServer.listen(httpPort, function () {
    console.log("Server is running on " + httpPort);
});
