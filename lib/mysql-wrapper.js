var mysqlModelClass = require('./mysql-model.js');
var mysqlConClass = require('./mysql-connection');
var Promise = require('bluebird');

function MySQLWrapper() {
    var args = Array.prototype.slice.call(arguments);
    if (args.length===0 && mysqlConClass.DefaultConnection) {
        //means the default connection object
        return mysqlConClass.DefaultConnection;
    }
    else if (args.length === 1) {
        // means table
        return _mysqlConMod.DefaultConnection.table(args[0])
    } else if (args.length > 1) {
        //means model
        return new mysqlModelClass(args[0], args[1]);
    }
};



MySQLWrapper.when = function () {
    var def = Promise.defer();
    var promises = Array.prototype.slice.call(arguments);
    
    if (Array.isArray(arguments[0])) {
        promises = Array.prototype.slice.call(promises[0]);
    } //here I check if first argument is array instead of just a function argument, Promise.all doesnt have this by default...but it should.
    
    
    Promise.all(promises).then(function (results) {
        
        def.resolve(results);
    });
    
    return def.promise;
};

module.exports = MySQLWrapper;