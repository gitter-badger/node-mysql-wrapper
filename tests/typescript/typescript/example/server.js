/// <reference path='../Scripts/typings/express/express.d.ts' />
/// <reference path='../Scripts/typings/node/node.d.ts' />
var express = require('express');
var app = express();
var http = require('http');
var httpServer = http.createServer(app);
var path = require('path');
var config = require('config');
var wrapper = require("../index");
var db = wrapper.wrap("mysql://kataras:pass@127.0.0.1/taglub?debug=false&charset=utf8"); // this returns a MysqlWrapper object.
//, "users", "user_infos", ["comments", "comment_likes"]); // second parameter for the tables you want to use ( default is all tables). OR->
//db.useOnly/.useTables("users", "user_infos", ["comments", "comment_likes"]);// default is to use all tables., must be called before _W.ready().
db.ready(function () {
    db.table("comments").findAll(function (results) {
        console.log(' found ' + results.length + ' [all] comments ');
        console.dir(results);
        console.log('-------------------------------------');
    });
    db.table("users").find({
        yearsOld: 22,
        userInfos: { userId: '=' },
        comments: {
            userId: '=',
            commentLikes: {
                commentId: '=',
                users: { userId: '=' }
            }
        }
    }, function (_results) {
        console.dir(_results);
        [].forEach.call(_results, function (result) {
            console.dir(result);
            /*
                console.log("=========COMMENTS from " + result.username + (result.userInfos.length > 0 ? " which hometown is " + result.userInfos[0].hometown : '') + " ======\n");

                [].forEach.call(result.comments, function (comment) {
                    console.log(comment.content + " with " + comment.commentLikes.length + " likes!");

                    if (comment.commentLikes.length > 0)
                        console.log('first like on this comment liked by: ' + comment.commentLikes[0].users[0].username);
                });

                console.log("===============\n\n");      */
        });
    });
    if (db.table("users").has("mailExists") === false) {
        db.table("users").extend("mailExists", function (mail, callback) {
            //to use find,save,delete,safeDelete we can do: this.model({mail:mail}); this.find(model,function(results){});
            //this =  the caller's MySQLTable, for example this =  the new  MySQLTable("users",db.connection), where this.name = "users", look at the next function.
            this.connection.query("SELECT COUNT(*) FROM " + this.name + " WHERE mail = " + this.connection.escape(mail), function (err, results) {
                if (!err && results.length > 0 && results[0]["COUNT(*)"] > 0) {
                    callback(true);
                }
                else {
                    callback(false);
                }
            });
        });
        db.table("users").extend("createSpecialUser", function (username, callback) {
            //var model= this.model();
            //this.save(model,callback);
            this.save({ username: username, mail: "special@email.com", yearsOld: 23 }, callback);
        });
    }
    db.table("users")["mailExists"]("mail20_updated@omakis.com", function (trueOrFalse) {
        console.log("User mail exists? " + trueOrFalse);
    });
});
//END OF EXAMPLES AND TESTS.
var httpPort = 1193; //config.get('Server.port') || 1193;
httpServer.listen(httpPort, function () {
    console.log("Server is running on " + httpPort);
});
//# sourceMappingURL=server.js.map