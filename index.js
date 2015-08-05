var _mysqlConMod = require('./lib/mysql-connection');


module.exports = function (dburl, isThisTheOnlyOneConnection) {
    if (isThisTheOnlyOneConnection) {
        global.MySQLTable = require('./lib/mysql-table.js');
        global.MySQLModel = require('./lib/mysql-model.js');
        
        global._T = function () {
            var args = Array.prototype.slice.call(arguments);
            //[Greek -for me] edw gia na MHN ginete new _T kanw auti tin fasi, episis edw elenw an uparxei table idi , tote epistrefw to idi uparxwn gia na mi ginete i allh diadikasia pou uparxei mesa sto mysqltable an dn exei dw9ei connection kai pernei ta columns apo to default connection
            if (args.length === 1) {
                return _mysqlConMod.DefaultConnection.table(args[0])
            } else {
                return new MySQLTable(args[0], args[1]);
            }
           
        };
        
        global._M = function () {
            var args = Array.prototype.slice.call(arguments);
            return new MySQLModel(args[0], args[1]);
        };
        
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
    return new _mysqlConMod(dburl, isThisTheOnlyOneConnection);
};

