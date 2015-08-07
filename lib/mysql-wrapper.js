var mysqlModelClass = require('./mysql-model.js');
var Promise = require('bluebird');

function MySQLWrapper() {
    var args = Array.prototype.slice.call(arguments);
    if (args.length === 1) {
        // means table
        return _mysqlConMod.DefaultConnection.table(args[0])
    } else {
        //means model
        return new mysqlModelClass(args[0], args[1]);
    }
};

MySQLWrapper.when = function () {
    var def = Promise.defer();
    var promises = Array.prototype.slice.call(arguments);
    
    Promise.all(promises).then(function (results) {

        def.resolve(results);
    });
    
    return def.promise;
};

module.exports = MySQLWrapper;