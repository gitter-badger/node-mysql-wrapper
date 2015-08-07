var _mysqlConMod = require('./lib/mysql-connection');
var mysqlWrapper = require('./lib/mysql-wrapper.js');
var mysqlTableClass = require('./lib/mysql-table.js');
var mysqlModelClass = require('./lib/mysql-model.js');
module.exports = function (mysqlUrlOrObjectOrMysqlAlreadyConnection, isThisTheOnlyOneConnection, useGlobals) {
    //isThisTheOnlyOneConnection default = true
    //useGlobals default = true  
    module.exports.MySQLTable = mysqlTableClass;
    module.exports.MySQLModel = mysqlModelClass;
    module.exports.MySQLWrapper = mysqlWrapper;

    if (useGlobals || useGlobals === undefined) {
        global.MySQLTable = mysqlTableClass;
        global.MySQLModel = mysqlModelClass;
        global._W = mysqlWrapper; 
    }
 
    return new _mysqlConMod(mysqlUrlOrObjectOrMysqlAlreadyConnection, isThisTheOnlyOneConnection || true);
};

