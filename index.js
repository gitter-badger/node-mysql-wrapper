var _mysqlConMod = require('./lib/mysql-connection');


module.exports = function (mysqlUrlOrObjectOrMysqlAlreadyConnection, isThisTheOnlyOneConnection) {
    if (isThisTheOnlyOneConnection) {
        global.MySQLTable = require('./lib/mysql-table.js');
        global.MySQLModel = require('./lib/mysql-model.js');
        
        global._W = function () {
            var args = Array.prototype.slice.call(arguments);
            if (args.length === 1)
            {
                 // means table
                return _mysqlConMod.DefaultConnection.table(args[0])
            } else {
                //means model
                return new MySQLModel(args[0], args[1]);
            }
        };
    } else {
        isThisTheOnlyOneConnection = false;
    }
    return new _mysqlConMod(mysqlUrlOrObjectOrMysqlAlreadyConnection, isThisTheOnlyOneConnection);
};

