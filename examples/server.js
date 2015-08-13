var express = require('express');
var app = express();
var httpServer = require('http').createServer(app);
var path = require('path');
var config = require('config');
var dbConfig = require('./config/database.json')[process.env.NODE_ENV || 'development'];


var _W = require('./../index')("mysql://kataras:pass@127.0.0.1/taglub?debug=false&charset=utf8");//, "users", "user_infos", ["comments", "comment_likes"]); // second parameter for the tables you want to use ( default is all tables). OR->
//_W.useOnly/.useTables("users", "user_infos", ["comments", "comment_likes"]);// default is to use all tables., must be called before _W.ready().
_W.ready(function () { //makes the connect or the link from prev connection and then call the function when it's ready. In here you can load your modules that inherites the wrapper.
    
    var insertWatcher = function (result) {
        console.log("LOG - USER INSERTED WITH DATA:");
        console.dir(result);
    };
    _W.users.on("insert", insertWatcher);
    

    
    _W.query("SELECT * FROM USERS", function (err, res) {
        console.log('query results: ');
        console.dir(res);
    });
    
    _W.users.find( 
        {
            yearsOld: 22,
            userInfos: { userId : '=' },
            comments: {
                userId: '=' , 
                commentLikes: {
                    commentId : '=', 
                    users: { userId : '=' }
                }
            }
      //  }).then(function (_results) { OR: 
        }, function (_results) {
            [].forEach.call(_results, function (result) {
                console.dir(result);
                console.log("=========COMMENTS from " + result.username + (result.userInfos.length > 0 ?  " which hometown is " + result.userInfos[0].hometown : '') + " ======\n");
                
                [].forEach.call(result.comments, function (comment) {
                    console.log(comment.content + " with " + comment.commentLikes.length + " likes!");
                    
                    if (comment.commentLikes.length > 0)
                        console.log('first like on this comment liked by: ' + comment.commentLikes[0].users[0].username);
                });
                
                console.log("===============\n\n");
            });
            
           
        });
    
    
    //    var newUser = { username: 'something for a new username', mail: ' a new mail' };
    var i = 1;
    _W.users.save({ username: 'something for a new username =' + i, mail: ' a new mail =' + i }, function (result) {
        console.log(result.userId + ' is the new userid');
        
        
        _W.users.delete(result, function (_delRes) {
            
            console.log('affected: ' + _delRes.affectedRows + ' old userID: ' + _delRes.userId);
            
            if (_W.users.has("mailExists") === false) {
                
                _W.users.extend("mailExists", function (mail, callback) {// OR MySQLModel.extend... this is a shared custom function extends for all models.
                    //to use find,save,delete,safeDelete we can do: this.model({mail:mail}); this.find(model,function(results){});
                    //this =  the caller's MySQLTable, for example this =  the new  MySQLTable("users",_W.connection), where this.name = "users", look at the next function.
                    this.connection.query("SELECT COUNT(*) FROM " + this.name + " WHERE mail = " + this.connection.escape(mail), function (err, results) {
                        if (!err && results.length > 0 && results[0]["COUNT(*)"] > 0) {
                            callback(true);
                        } else {
                            callback(false);
                        }
                    });

                });
                
                _W.users.extend("createSpecialUser", function (username, callback) {
                    //var model= this.model();
                    //this.save(model,callback);
                    
                    this.save({ username: username, mail: "special@email.com", yearsOld : 23 }, callback);
                });
            }
            
            _W.users.mailExists("mail20_updated@omakis.com", function (trueOrFalse) {
                console.log("User mail exists? " + trueOrFalse);
            });
            
            _W.users.off("insert", insertWatcher);

            _W.users.createSpecialUser("a special username", function (rowResult) {
                console.log("a  special user row just created");
                console.dir(rowResult);
            });
            
        });
        
          
    });
  


    // _W.When EXAMPLE:

    var findAllByUsername = _W.users({ username: 'a username' }).find();
    var findAllLikesFromUserId = _W.commentLikes.({ userId: 18 }).find();
    var findAllCommentsFromUserId = _W.comments({ userId: 18 }).find();
    
    _W.when(findAllByUsername, findAllLikesFromUserId, findAllCommentsFromUserId).then(function (_results) {
        
        console.log('find all users with USERNAME results: ');
        console.dir(_results[0]);
        console.log('\n find all LIKES by user id 18 results: ');
        console.dir(_results[1]);
        console.log('\n find all COMMENTS by user id 18 results: ');
        console.dir(_results[2]);
        console.log('\n');
    });
    
   */


   
});
//END OF EXAMPLES AND TESTS.

var httpPort = 1193;//config.get('Server.port') || 1193;
httpServer.listen(httpPort, function () {
    console.log("Server is running on " + httpPort);
});
