var Promise = require('bluebird');
var mysql = require('mysql');
var MySQLTable = require('./mysql-table.js');

var MySQLConnection = function () {
    
    var connection = {};
    this.tables = [];
    
    this.create = function (mysqlUrl) {
        connection = mysql.createConnection(mysqlUrl);
    };
    
    this.attach = function (_connection) {
        connection = _connection;
    };
    
    this.fetchDatabaseInfornation = function () {
        //Ta kanw ola edw gia na doulepsei to def.resolve kai na einai etoimo olo to module molis ola ta tables kai ola ta columns dhlwthoun.
        var def = Promise.defer();
        var self = this;
        
        connection.query("SELECT DISTINCT TABLE_NAME ,column_name FROM INFORMATION_SCHEMA.key_column_usage WHERE TABLE_SCHEMA IN ('" + connection.config.database + "');", function (err, results) {
            
            [].forEach.call(results, function (tableObj, currentPosition) {
                var _table = new MySQLTable(tableObj.TABLE_NAME, self);
                _table.setPrimaryKey(tableObj.column_name);
                
                connection.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '" + connection.config.database + "' AND TABLE_NAME = '" + _table.name + "';", function (errC, resultsC) {
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

            });


        });
        
        return def.promise;
    };
    
    this.connect = function () {
        var def = Promise.defer();
        var self = this;
        var callback = arguments[0] ||
          function (err) {
            if (err) {
                console.error('MYSQL: error connecting: ' + err.stack);
                def.reject(err.stack);
                return;
            }
            
            console.log('MYSQL: connected as id ' + connection.threadId);
            
            self.fetchDatabaseInfornation().then(function () {
                def.resolve();
            });


        };
        
        connection.connect(callback);
        return def.promise;
    };
    
    
    
    
    /*because of private access of real/original connection, I have to provide these function here ( this is bad because everytime mysqlCon created these are created too, but I think this will be not a big deal, how many different connections has an application?*/
    this.escape = function (strOrWhatever) {
        return connection.escape(strOrWhatever);
    };
    
    this.query = function () {
        var queryStr, queryArguments, callback;
       // var args = [].slice.call(arguments);
        queryStr = arguments[0];
        
        if (arguments.length === 2) { //means only: queryStr and the callback
            callback = arguments[1];
            connection.query(queryStr, function (err, results) { callback(err, results); });
        } else if (arguments.length === 3) { //means : queryStr, queryArguments and the callback
            queryArguments = arguments[1];
            
            callback = arguments[2];
            connection.query(queryStr, queryArguments, function (err, results) { callback(err, results); });
        }

        

    };
    
    
    //init
    
    if (arguments.length > 0) {
        this.create(arguments[0]);
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