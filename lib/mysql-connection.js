var Promise = require('bluebird');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var mysql = require('mysql');
var MySQLTable; // pio katw to dilwnw otan kanei to connect/link gt aliws dn 9a borw na loadarw mia fora to connection kia oxi ka9e fora sto model.

var EVENT_TYPES = ["INSERT", "UPDATE", "DELETE", "SAVE"]; //SAVE = INSERT OR UPDATE, the SELECT is not here because on nested queries will be spamming unnessecary events...

var MySQLConnection = function () {
    this.tableNamesToUseOnly = [];
    this.connection = {};
    this.tables = [];
    
    this.create = function (mysqlUrlOrObjectOrMysqlAlreadyConnection) {
        if (mysqlUrlOrObjectOrMysqlAlreadyConnection.config !== undefined) { //means that is mysql already connection
            this.attach(mysqlUrlOrObjectOrMysqlAlreadyConnection);
        } else {
            this.attach(mysql.createConnection(mysqlUrlOrObjectOrMysqlAlreadyConnection));
        }
     
    };
    
    this.attach = function (_connection) {
        this.connection = _connection;
    };
    
    this.end = function (maybeAcallbackError) {
        this.removeAllListeners(EVENT_TYPES);
        this.connection.end(function (err) {
            // The connection is terminated now
            maybeAcallbackError(err);
           
        });
    };
    
    this.destroy = function () {
        // Additionally destroy() guarantees that no more events or callbacks will be triggered for the connection.
        this.removeAllListeners(EVENT_TYPES);
        this.connection.destroy();
       
    };
    
    //init
    var args = Array.prototype.slice.call(arguments);
    if (!args || args.length === 0) {
      
    }
    else if (args.length > 0) {
        this.create(args[0]);
    }
    
};

util.inherits(MySQLConnection, EventEmitter);

MySQLConnection.prototype.link = MySQLConnection.prototype.connect = function () {
    var def = Promise.defer();
    var self = this;
    var callback = arguments[0] ||
          function (err) {
        if (err) {
            console.error('MYSQL: error connecting: ' + err.stack);
            def.reject(err.stack);
            return;
        }
        
        //console.log('MYSQL: connected as id ' + self.connection.threadId);
        self.fetchDatabaseInfornation().then(function () {
            def.resolve();
           // self.noticeReady();
        });


    };
    if (self.connection.state === 'authenticated') {
        def.resolve();
        callback();
    } else {
        self.connection.connect(callback);

    }
    
    return def.promise;
};

MySQLConnection.prototype.useOnly = function () {
    var args = Array.prototype.slice.call(arguments);
    for (var i = 0; i < args.length; i++) {
        var _argument = args[i];
        if (typeof _argument === 'string' || _argument instanceof String) {
            //it is just the table name string
            this.tableNamesToUseOnly.push(_argument);
        } else {
            //it is an array of strings
            for (var j = 0; j < _argument.length ; j++) {
                this.tableNamesToUseOnly.push(_argument[j]);
            }
        }
    }
  
};

MySQLConnection.prototype.fetchDatabaseInfornation = function () {
    //Ta kanw ola edw gia na doulepsei to def.resolve kai na einai etoimo olo to module molis ola ta tables kai ola ta columns dhlwthoun.
    var def = Promise.defer();
    MySQLTable = require('./mysql-table.js');
    var self = this;
    
    self.connection.query("SELECT DISTINCT TABLE_NAME ,column_name FROM INFORMATION_SCHEMA.key_column_usage WHERE TABLE_SCHEMA IN ('" + self.connection.config.database + "');", function (err, results) {
        
        [].forEach.call(results, function (tableObj, currentPosition) {
            if (self.tableNamesToUseOnly.length > 0 && self.tableNamesToUseOnly.indexOf(tableObj.TABLE_NAME) === -1) {
                //means that only to use called, and this table is not in this collection, so don't fetch it.
            } else {
                var _table = new MySQLTable(tableObj.TABLE_NAME, self);
                _table.setPrimaryKey(tableObj.column_name);
                
                self.connection.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '" + self.connection.config.database + "' AND TABLE_NAME = '" + _table.name + "';", function (errC, resultsC) {
                    var _tableColumns = [];
                    
                    for (var i = 0; i < resultsC.length; i++) {
                        var _columnName = resultsC[i].COLUMN_NAME;
                        if (_columnName !== _table.primaryKey) {
                            _tableColumns.push(_columnName);
                        }
                    }
                    
                    _table.setColumns(_tableColumns);
                    self.tables.push(_table);
                    
                    if (currentPosition === results.length - 1) {
                        //otan teleiwsoume me ola
                        
                        def.resolve();
                    }

                });
            }
        });


    });
    
    return def.promise;
};

MySQLConnection.prototype.escape = function (strOrWhatever) {
    return this.connection.escape(strOrWhatever);
};

MySQLConnection.prototype.notice = MySQLConnection.prototype.fireEvent = function (tableWhichCalled, queryStr, parsedResults) {
    
    var evtType;
    //get the first word from the query, usualy is INSERT OR UPDATE OR DELETE OR SELECT
    if (queryStr.indexOf(' ') === -1) {
        evtType = undefined;
    } else {
        evtType = queryStr.substr(0, queryStr.indexOf(' ')).toUpperCase();
    }
    
    if (evtType !== undefined) {
        if (evtType === 'INSERT' || evtType === 'UPDATE') {
            this.emit(tableWhichCalled.toUpperCase() + ".SAVE", parsedResults);
        }
        this.emit(tableWhichCalled.toUpperCase() + "." + evtType, parsedResults);
    }
 
};

MySQLConnection.prototype.watch = function (tableName, evtType, callback) {
    if (Array.isArray(evtType)) {
        //if it is array then we catch more than one event with the same callback, this maybe will be 'helpy' to some devs
        for (var i = 0; i < evtType.length; i++) {
            var _theEventType = evtType[i].toUpperCase();
            if (EVENT_TYPES.indexOf(_theEventType) !== -1) {
                this.on(tableName.toUpperCase() + "." + _theEventType, callback);
            }
        }
    } else {
        evtType = evtType.toUpperCase();
        if (EVENT_TYPES.indexOf(evtType) !== -1) {
            this.on(tableName.toUpperCase() + "." + evtType, callback);
        }
    }
    
   
};

MySQLConnection.prototype.unwatch = function (tableName, evtType, callbackToRemove) {
    evtType = evtType.toUpperCase();
    if (EVENT_TYPES.indexOf(evtType) !== -1) {
        this.removeListener(tableName.toUpperCase() + "." + evtType, callbackToRemove);
    }
};

MySQLConnection.prototype.query = function () {
    
    var queryStr, queryArguments, callback;
    var args = Array.prototype.slice.call(arguments);
    queryStr = args[0];
    if (args.length === 2) { //means only: queryStr and the callback
        callback = args[1];
        this.connection.query(queryStr, function (err, results) {
            callback(err, results);
        });
    } else if (args.length === 3) { //means : queryStr, queryArguments and the callback
        queryArguments = args[1];
        
        callback = args[2];
        this.connection.query(queryStr, queryArguments, function (err, results) {
            callback(err, results);
        });
    }
};

MySQLConnection.prototype.table = function (tableName) {
    for (var i = 0; i < this.tables.length; i++) {
        
        if (this.tables[i].name === tableName) {
            
            return this.tables[i];
        }
    }
    return undefined;
};

module.exports.EVENT_TYPES = EVENT_TYPES;
module.exports = MySQLConnection;