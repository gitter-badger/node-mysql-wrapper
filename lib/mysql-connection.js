var deferred = require('deferred');
var mysql = require('mysql');
var MySQLConnection = function () {

    var connection = {};
    this.tables = [];
    this.create = function (mysqlUrl) {
        connection = mysql.createConnection(mysqlUrl);
    };

    this.attach = function (_connection) {
        connection = _connection;
    };

    this.get = function () {
        return connection;
    };

    this.connect = function () {
        var def = deferred();
        var callback = arguments[0] ||
          function (err) {
              if (err) {
                  console.error('MYSQL: error connecting: ' + err.stack);
                  def.reject(err.stack);
                  return;
              }

              console.log('MYSQL: connected as id ' + connection.threadId);
              def.resolve();

          };

        connection.connect(callback);
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

    this.setTables = function (jsonFileOrObject) {
        this.tables = this.fetchTables(jsonFileOrObject);
    };

    this.createModel = function (jsObject, table) {
        //GLOBAL VARIABLES FROM THEIR OWN FILES
        return new MySQLModel(jsObject, table, this);
    };
    //return def.promise;
};



global.MySQLConnection = MySQLConnection;