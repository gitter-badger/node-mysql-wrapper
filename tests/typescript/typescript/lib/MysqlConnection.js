/// <reference path="./../Scripts/typings/mysql/mysql.d.ts"/>
/// <reference path="./../Scripts/typings/bluebird/bluebird.d.ts"/> 
var Mysql = require('mysql');
var Util = require('util');
var Promise = require('bluebird');
var events_1 = require('events');
var MysqlTable_1 = require("MysqlTable");
/* prostoparwn den xrisimopoiounte , akoma tlxstn
export enum EventTypes {
    Insert, Update, Remove, Save

}*/
var MysqlConnection = (function () {
    function MysqlConnection(connection) {
        this.eventTypes = ["INSERT", "UPDATE", "REMOVE", "SAVE"];
        this.tableNamesToUseOnly = [];
        this.tables = [];
        this.create(connection);
        Util.inherits(this, events_1.EventEmitter);
    }
    MysqlConnection.prototype.create = function (connection) {
        if (typeof connection === "string") {
            this.attach(Mysql.createConnection(connection));
        }
        else {
            this.attach(connection);
        }
    };
    MysqlConnection.prototype.attach = function (connection) {
        this.connection = connection;
    };
    MysqlConnection.prototype.end = function (callback) {
        this["removeAllListeners"](this.eventTypes);
        this.connection.end(function (err) {
            // The connection is terminated now
            callback(err);
        });
    };
    MysqlConnection.prototype.destroy = function () {
        this["removeAllListeners"](this.eventTypes);
        this.connection.destroy();
    };
    MysqlConnection.prototype.link = function (readyCallback) {
        var _this = this;
        var def = Promise.defer();
        var callback = readyCallback() ||
            (function (err) {
                if (err) {
                    console.error('MYSQL: error connecting: ' + err.stack);
                    def.reject(err.stack);
                }
                //console.log('MYSQL: connected as id ' + self.connection.threadId);
                _this.fetchDatabaseInfornation().then(function () {
                    def.resolve();
                    // self.noticeReady();
                });
            });
        // if (this.connection.state === 'authenticated') {
        if (this.connection['state'] === 'authenticated') {
            readyCallback();
            def.resolve();
        }
        else {
            this.connection.connect(callback);
        }
        return def.promise;
    };
    MysqlConnection.prototype.useOnly = function () {
        var tables = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            tables[_i - 0] = arguments[_i];
        }
        for (var i = 0; i < tables.length; i++) {
            var _table = tables[i];
            if (typeof _table === 'string' || _table instanceof String) {
                //it is just the table name string
                this.tableNamesToUseOnly.push(_table);
            }
            else {
                //it is an array of strings
                for (var j = 0; j < _table.length; j++) {
                    this.tableNamesToUseOnly.push(_table[j]);
                }
            }
        }
    };
    MysqlConnection.prototype.fetchDatabaseInfornation = function () {
        //Ta kanw ola edw gia na doulepsei to def.resolve kai na einai etoimo olo to module molis ola ta tables kai ola ta columns dhlwthoun.
        var def = Promise.defer();
        var self = this;
        self.connection.query("SELECT DISTINCT TABLE_NAME ,column_name FROM INFORMATION_SCHEMA.key_column_usage WHERE TABLE_SCHEMA IN ('" + self.connection.config.database + "');", function (err, results) {
            [].forEach.call(results, function (tableObj, currentPosition) {
                if (self.tableNamesToUseOnly.length > 0 && self.tableNamesToUseOnly.indexOf(tableObj.TABLE_NAME) === -1) {
                }
                else {
                    var _table = new MysqlTable_1.MysqlTable(tableObj.TABLE_NAME, self);
                    _table.primaryKey = (tableObj.column_name);
                    self.connection.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '" + self.connection.config.database + "' AND TABLE_NAME = '" + _table.name + "';", function (errC, resultsC) {
                        var _tableColumns = [];
                        for (var i = 0; i < resultsC.length; i++) {
                            var _columnName = resultsC[i].COLUMN_NAME;
                            if (_columnName !== _table.primaryKey) {
                                _tableColumns.push(_columnName);
                            }
                        }
                        _table.columns = (_tableColumns);
                        self.tables.push(_table);
                        if (currentPosition === results.length - 1) {
                            //otan teleiwsoume me ola
                            def.resolve();
                        }
                    });
                }
            });
        });
        return (def.promise);
    };
    MysqlConnection.prototype.escape = function (val) {
        return this.connection.escape(val);
    };
    MysqlConnection.prototype.notice = function (tableWhichCalled, queryStr, parsedResults) {
        var evtType;
        //get the first word from the query, usualy is INSERT OR UPDATE OR DELETE OR SELECT
        if (queryStr.indexOf(' ') === -1) {
            evtType = undefined;
        }
        else {
            evtType = queryStr.substr(0, queryStr.indexOf(' ')).toUpperCase();
        }
        if (evtType !== undefined) {
            if (evtType === 'INSERT' || evtType === 'UPDATE') {
                this["emit"](tableWhichCalled.toUpperCase() + ".SAVE", parsedResults);
            }
            this["emit"](tableWhichCalled.toUpperCase() + "." + evtType, parsedResults);
        }
    };
    //evtType:  EventTypes[]  | EventTypes | string,
    MysqlConnection.prototype.watch = function (tableName, evtType, callback) {
        if (Array.isArray(evtType)) {
            //if it is array then we catch more than one event with the same callback, this maybe will be 'helpy' to some devs
            for (var i = 0; i < evtType.length; i++) {
                var _theEventType = evtType[i].toUpperCase();
                if (this.eventTypes.indexOf(_theEventType) !== -1) {
                    this["on"](tableName.toUpperCase() + "." + _theEventType, callback);
                }
            }
        }
        else {
            evtType = evtType.toUpperCase();
            if (this.eventTypes.indexOf(evtType) !== -1) {
                this["on"](tableName.toUpperCase() + "." + evtType, callback);
            }
        }
    };
    //evtType: EventTypes 
    MysqlConnection.prototype.unwatch = function (tableName, evtType, callbackToRemove) {
        evtType = evtType.toUpperCase();
        if (this.eventTypes.indexOf(evtType) !== -1) {
            this["removeListener"](tableName.toUpperCase() + "." + evtType, callbackToRemove);
        }
    };
    MysqlConnection.prototype.query = function (queryStr, callback, queryArguments) {
        if (queryArguments) {
            this.connection.query(queryStr, queryArguments, function (err, results) {
                callback(err, results);
            });
        }
        else {
            this.connection.query(queryStr, function (err, results) {
                callback(err, results);
            });
        }
    };
    MysqlConnection.prototype.table = function (tableName) {
        for (var i = 0; i < this.tables.length; i++) {
            if (this.tables[i].name === tableName) {
                return this.tables[i];
            }
        }
        return undefined;
    };
    return MysqlConnection;
})();
exports.MysqlConnection = MysqlConnection;
//# sourceMappingURL=MysqlConnection.js.map