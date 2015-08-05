var Promise = require('bluebird');
var mysql = require('mysql');
var MySQLTable = require('./mysql-table.js');

var MySQLConnection = function () {
    this.tableNamesToUseOnly = [];
    this.connection = {};
    this.tables = [];
    
    this.create = function (mysqlUrl) {
        this.connection = mysql.createConnection(mysqlUrl);
    };
    
    this.attach = function (_connection) {
        this.connection = _connection;
    };
    
    
    //init
    var args = Array.prototype.slice.call(arguments);
    if (!args || args.length === 0) {
      
    }
    else if (args.length > 0) {
        this.create(args[0]);
        if (args.length >= 1 && args[1] === true) {
            module.exports.DefaultConnection = this;
        }
   
    }

};


MySQLConnection.prototype.connect = function () {
    var def = Promise.defer();
    var self = this;
    var callback = arguments[0] ||
          function (err) {
        if (err) {
            console.error('MYSQL: error connecting: ' + err.stack);
            def.reject(err.stack);
            return;
        }
        
        console.log('MYSQL: connected as id ' + self.connection.threadId);
        
        self.fetchDatabaseInfornation().then(function () {
            def.resolve();
        });


    };
    
    self.connection.connect(callback);
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


MySQLConnection.prototype.query = function () {
    var queryStr, queryArguments, callback;
    // var args = [].slice.call(arguments);
    queryStr = arguments[0];
    
    if (arguments.length === 2) { //means only: queryStr and the callback
        callback = arguments[1];
        this.connection.query(queryStr, function (err, results) { callback(err, results); });
    } else if (arguments.length === 3) { //means : queryStr, queryArguments and the callback
        queryArguments = arguments[1];
        
        callback = arguments[2];
        this.connection.query(queryStr, queryArguments, function (err, results) { callback(err, results); });
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


module.exports = MySQLConnection;