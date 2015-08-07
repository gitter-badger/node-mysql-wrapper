var Promise = require('bluebird');
//you are seeing well, no need of require the node-mysql-wrapper, because you pass a 'true' on the second parameter on server.js
var User = function () {
    
};


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



module.exports = new User();