/// <reference path="./node_modules/node-mysql-wrapper/compiled/typings/node-mysql-wrapper/node-mysql-wrapper.d.ts" />
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var wrapper2 = require("node-mysql-wrapper");
var db = wrapper2.wrap("mysql://kataras:pass@127.0.0.1/taglub?debug=false&charset=utf8");
var User = (function () {
    function User() {
    }
    return User;
})();
db.ready(function () {
    var usersDb = db.table("users");
    //or var usersDb = db.table("users"); if you don't want intel auto complete from your ide/editor
    usersDb.findById(16, function (_user) {
        console.log("TEST1: \n");
        console.log("FOUND USER WITH USERNAME: " + _user.username);
    });
    /* OR   usersDb.findById(18).then(_user=> {
         console.log("FOUND USER WITH USERNAME: " + _user.username);
     }, (err) => { console.log("ERROR ON FETCHING FINDBY ID: " + err) });
   */
    usersDb.findSingle({
        userId: 18,
        myComments: {
            userId: '=',
            tableRules: {
                table: "comments",
                limit: 50,
                orderByDesc: "commentId" //give me the first 50 comments ordered by -commentId (DESC) from table 'comments' and put them at 'myComments' property inside the result object.
            }
        }
    }).then(function (_user) {
        console.log("\n-------------TEST 2 ------------\n");
        console.log(_user.username + " with ");
        console.log(_user.myComments.length + " comments ");
        _user.myComments.forEach(function (_comment) {
            console.log("--------------\n" + _comment.content);
        });
    });
    usersDb.remove(5620, function (answer) {
        console.log("TEST 3: \n");
        console.log(answer.affectedRows + ' (1) has removed from table:  ' + answer.table);
    });
    var auser = new User();
    auser.username = ' just a username';
    auser.mail = ' just an email';
    usersDb.save(auser, function (newUser) {
        console.log("TEST 4: \n");
        console.log("NEW USER HAS CREATED WITH NEW USER ID: " + newUser.userId);
    });
    /* SELECT QUERY (FIND METHODS) RULES
    : */
    //as default rules are empty but they are exists so you can just simply:
    //usersDb.rules.orderBy("userId", true);//this applied to all select queries referenced/executed by users table. whereClause  + ' ORDER BY user_id DESC'
    //and clear all: usersDb.rules.clear();
    //define new table rules:
    // or usersDb.rules = new wrapper2.SelectQueryRules().limit(10).orderBy("userId",true);//or wrapper2.SelectQueryRules.build().... db.newTableRules(usersDb.name)... //or  db.newTableRules(usersDb.name)...
    //redefine but keep unchanged rules in table: 
    // usersDb.rules = new wrapper2.SelectQueryRules().from(usersDb.rules).limit(20);  // or wrapper2.SelectQueryRules.build(usersDb.rules).limit(20); now rules will have limit 10 but the order by userId it remains as it is.
    //redefine but keep unchanged rules in find method:
    usersDb.find({
        yearsOld: 22,
        comments: {
            userId: "=",
            tableRules: {
                limit: 2
            }
        }
    }, function (_users) {
        /* or wrapper2.SelectQueryRules.build(usersDb.rules)... or db.buildRules(usersDb.rules)... or new wrapper2.SelectQueryRules().from(userDb.rules)...  this rules will keep the order by userId (user_id) column.*/
        console.log("---------------TEST 6----------------------------------------");
        _users.forEach(function (_user) {
            console.log(_user.userId + " " + _user.username + " found with " + _user.comments.length + " comments");
        });
    });
    //if no rules setted to find method  it's uses the table's rules ( if exists)
    var _criteriaFromBuilder = usersDb.criteria
        .where("userId", 24)
        .joinAs("info", "userInfos", "userId") //auto 9a borousa na to kanw na min xreiazete kan to 2o parameter kai na pernei to primary key name tou parent table.
        .at("info")
        .limit(1) //because we make it limit 1 it will return this result as object not as array.
        .parent()
        .joinAs("myComments", "comments", "userId") // kai edw episis na min xreiazete de kai kala to 3o parameter , an dn uparxei as pernei to primary key name tou parent table. 
        .at("myComments").limit(2)
        .joinAs("likes", "commentLikes", "commentId")
        .original().orderBy("userId", true).build();
    /* console.dir(_criteriaFromBuilder);
     prints this object: ( of course you can create your own in order to pass it on .find table methods )
    {
        userId:23,
        
        myComments:{
            userId: '=',
            
            tableRules:{
                table: 'comments',
                limit:2
            },
            
            likes:{
                commentId: '=',
                
                tableRules:{
                    table: 'commentLikes'
                }
               
            }
        },
        
        tableRules:{
            orderByDesc: 'userId'
        }
        
    }
    
    
    */
    usersDb.find(_criteriaFromBuilder).then(function (_users) {
        console.log("\n----------------\nTEST ADVANCED 1\n-------------------\n ");
        _users.forEach(function (_user) {
            console.log(_user.userId + " " + _user.username);
            if (_user.info !== undefined) {
                console.log(' from ' + _user.info.hometown);
            }
            if (_user.myComments !== undefined) {
                _user.myComments.forEach(function (_comment) {
                    console.log(_comment.commentId + " " + _comment.content);
                    if (_comment.likes !== undefined) {
                        console.log(' with ' + _comment.likes.length + ' likes!');
                    }
                });
            }
        });
    });
});
server.on('uncaughtException', function (err) {
    console.log(err);
});
var httpPort = 1193; //config.get('Server.port') || 1193;
server.listen(httpPort, function () {
    console.log("Server is running on " + httpPort);
});
