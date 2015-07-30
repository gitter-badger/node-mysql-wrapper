var deferred = require('deferred');
var mysql = require('mysql');
var MySQLTable = require('./mysql-table.js');

var MySQLConnection = function () {

    this.connection = {};
    this.tables = [];
    this.create = function (mysqlUrl) {
        this.connection = mysql.createConnection(mysqlUrl);
    };

    this.attach = function (_connection) {
        this.connection = _connection;
    };

    
    this.fetchDatabaseInfornation = function () {
        //Ta kanw ola edw gia na doulepsei to def.resolve kai na einai etoimo olo to module molis ola ta tables kai ola ta columns dhlwthoun.
        var def = deferred();
        var self = this;
        self.connection.query("SELECT DISTINCT TABLE_NAME ,column_name FROM INFORMATION_SCHEMA.key_column_usage WHERE TABLE_SCHEMA IN ('" + self.connection.config.database + "');", function (err, results) {
   
            [].forEach.call(results, function (tableObj,currentPosition) {
                var _table = new MySQLTable(tableObj.TABLE_NAME,self.connection);
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
                   
                    if (currentPosition === results.length-1) {
                        //otan teleiwsoume me ola
                 
                        def.resolve();
                    }
                  
                });
           
            });
            
      
        });

        return def.promise;
    };

   

    this.connect = function () {
        var def = deferred();
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

        this.connection.connect(callback);
        return def.promise;
    };

    //for model

    this.fetchTables = function (jsonFileOrObject) {
        if (typeof jsonFileOrObject === 'string' || jsonFileOrObject instanceof String) {
            // it's a string path
            var path = require('path');
            var appDir = path.dirname(require.main.filename);
            if (jsonFileOrObject.indexOf('.') === 0) {
                jsonFileOrObject = jsonFileOrObject.substring(1); //If starts with ./ remove the .
            }
            return require(appDir + jsonFileOrObject);
        } else {
            return jsonFileOrObject;
        }
    };



    //init

    if (arguments.length > 0) {
        this.create(arguments[0]);
        // this.connect();

    } else {
        // def.resolve();
    }


  
    //return def.promise;
};

MySQLConnection.prototype.table = function (tableName) {
    for (var i = 0; i < this.tables.length; i++) {
       
        if (this.tables[i].name === tableName) {
            return this.tables[i];
        }
    }
};

module.exports = MySQLConnection;