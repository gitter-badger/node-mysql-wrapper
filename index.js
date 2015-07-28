/*var MySQLConnection = require('./lib/mysql-connection'),
    MySQLModel = require('./lib/mysql-model')

//global.MySQLConnection = MySQLConnection;
//global.MySQLFactory = MySQLFactory;
//global.MySQLModel = MySQLModel; : 27/07/2015 global set's from their classes*/
var _mysqlConMod = require('./lib/mysql-connection');
module.exports = function (dburl) {
  
    return new _mysqlConMod(dburl);
};

