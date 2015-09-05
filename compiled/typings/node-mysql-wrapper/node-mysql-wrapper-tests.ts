/// <reference path="./node-mysql-wrapper.d.ts" />
var express = require('express');
var app = express();
var server = require('http').createServer(app);
import wrapper2 = require("node-mysql-wrapper");
var db = wrapper2.wrap("mysql://kataras:pass@127.0.0.1/taglub?debug=false&charset=utf8");

class User { //or interface
    userId: number;
    username: string;
    mail: string;
    comments: Comment[];
}

interface Comment {
    commentId: number;
    content: string;

}

db.ready(() => {


    var usersDb = db.table<User>("users");
   
    /* usersDb.rules.orderBy("userId",true); //this applied to all select queries referenced/executed by users table. whereClause  + ' ORDER BY user_id DESC'
     usersDb.rules.limit(5); 
    
     
     usersDb.findAll().then(users=> {
             users.forEach(user=> {
                 console.log(user.userId);
             });
     });*/
    
    //define totally new  table rules
    
    //in default rules are empty but they are exists so you can just simply:
    usersDb.rules.orderBy("userId", true);
    
    //define new table rules:
    // or usersDb.rules = new wrapper2.SelectQueryRules().limit(10).orderBy("userId",true);//or wrapper2.SelectQueryRules.build().... db.newTableRules(usersDb.name)... //or  db.newTableRules(usersDb.name)...
    //redefine but keep unchanged rules in table: 
    // usersDb.rules = new wrapper2.SelectQueryRules().from(usersDb.rules).limit(20);  // or wrapper2.SelectQueryRules.build(usersDb.rules).limit(20); now rules will have limit 10 but the order by userId it remains as it is.
  
    //redefine but keep unchanged rules in find method: (second parameters takes a callback or rules, if it's rules then the third parameter is the callback.)
      
    usersDb.find({ yearsOld: 22 }, db.buildRules().from(usersDb.rules).limit(3), (_users) => {
        /* or wrapper2.SelectQueryRules.build(usersDb.rules)... or db.buildRules(usersDb.rules)... or new wrapper2.SelectQueryRules().from(userDb.rules)...  this rules will keep the order by userId (user_id) column.*/

        console.log("-------------------------------------------------------");
        _users.forEach(_user=> {
            console.log(_user.userId + " " + _user.username + " found with limit 3 but this doesnt...");

        });

    });
    
    
    
    //or var usersDb = db.table("users");
    //and on callbacks on findById: _user:any. on find: var _user:any = _users[0]; and so on...

    usersDb.findById(16, (_user) => {

        console.log("TEST1: \n");
        console.log("FOUND USER WITH USERNAME: " + _user.username);
    });

    /* OR   usersDb.findById(18).then(_user=> {
         console.log("FOUND USER WITH USERNAME: " + _user.username);
     }, (err) => { console.log("ERROR ON FETCHING FINDBY ID: " + err) });
   */

    usersDb.find({ userId: 18, comments: { userId: '=' } }, _users=> {

        var _user = _users[0];

        console.log("TEST2: \n");
        console.log(_user.username + " with ");
        console.log(_user.comments.length + " comments ");
        _user.comments.forEach(_comment=> {
            console.log("--------------\n" + _comment.content);
        });

    });

    usersDb.safeRemove(5620, answer=> {
        console.log("TEST 3: \n");
        console.log(answer.affectedRows + ' (1) has removed from table:  ' + answer.table);

    });

    var auser = new User();
    auser.username = ' just a username';
    auser.mail = ' just an email';

    usersDb.save(auser, newUser=> {
        console.log("TEST 4: \n");
        console.log("NEW USER HAS CREATED WITH NEW USER ID: " + newUser.userId);

    });


});


var httpPort = 1193;//config.get('Server.port') || 1193;
server.listen(httpPort, function() {
    console.log("Server is running on " + httpPort);
});