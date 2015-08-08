var Promise = require('bluebird');
//you are seeing well, no need of require the node-mysql-wrapper, because you pass a 'true' on the second parameter on server.js
var User = function () {
    
};

MySQLModel.extend("findUserWithComments", function (userId, callback) {
    var self = this;
    this.jsObject = { userId: userId, comments: { userId : '=' } }; //We CANNOT DO comments{ userId: '=', likes: { commentId : '='}}, we will fetch comment's likes later in this function, only first-level relationship tables can be fetched by find() method.
    this.find().then(function (results) {
        var _user = results[0];
        var promises = [];
        for (var i = 0; i < _user.comments.length ; i++) { 
            //    promises.push(_W("comment_likes", { commentId: _user.comments[i].commentId }).find());
            var findLikes = _W("comment_likes", { commentId: _user.comments[i].commentId }).find();
            promises.push(findLikes);
          /*  findLikes.then(function (_res) {
                [].forEach.call(_user.comments, function (_comment) {
                    
                    if (_comment.commentId === _res[0].commentId) {
                        _comment.likes = _res;
                        //_user.comments.push(_comment);
                    }
                });
                
            }); OR: */
        };
        
        _W.when(promises).then(function (_commentLikesAllresults) {
            [].forEach.call(_user.comments, function (_comment) {
                [].forEach.call(_commentLikesAllresults, function (_commentLikesList) {
                    if (_commentLikesList[0].commentId === _comment.commentId) {
                        _comment.likes = _commentLikesList;
                    }
                });
            });
            callback(_user);
           
        });

    });
});
User.prototype.login = function (mail, password) {
    var def = Promise.defer();
    
    _W('users', { mail: mail, password: password }).find().then(function (results) {
        if (results.length > 0) {
            def.resolve(results[0]);
        } else {
            def.reject();
        }
    });
    
    return def.promise;
};
//OR
User.prototype.login2 = function (mail, password) {
    var def = Promise.defer();
    var userTable = new MySQLTable('users');
    userTable.model({ mail: mail, password: password }).find().then(function (results) {
        if (results.length > 0) {
            def.resolve(results[0]);
        } else {
            def.reject();
        }
    });
    
    return def.promise;
};

User.prototype.getFullUser = function (userId, callback) {
    _W("users", {}).findUserWithComments(userId, function (_userReturned) {
        callback(_userReturned);
    });
};




module.exports = new User();