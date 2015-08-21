/// <reference path="./../Scripts/typings/mysql/mysql.d.ts"/>
/// <reference path="./../Scripts/typings/bluebird/bluebird.d.ts"/> 
var Promise = require('bluebird');
var MysqlTable_1 = require("MysqlTable");
(function (EventTypes) {
    EventTypes[EventTypes["Insert"] = 0] = "Insert";
    EventTypes[EventTypes["Update"] = 1] = "Update";
    EventTypes[EventTypes["Delete"] = 2] = "Delete";
    EventTypes[EventTypes["Save"] = 3] = "Save";
})(exports.EventTypes || (exports.EventTypes = {}));
var EventTypes = exports.EventTypes;
var MysqlConnection = (function () {
    function MysqlConnection(connection) {
        this.create(connection);
    }
    MysqlConnection.prototype.create = function (connection) {
    };
    MysqlConnection.prototype.attach = function (connection) {
    };
    MysqlConnection.prototype.end = function (callback) {
    };
    MysqlConnection.prototype.destroy = function () {
    };
    MysqlConnection.prototype.link = function () {
    };
    MysqlConnection.prototype.useOnly = function () {
        var tables = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            tables[_i - 0] = arguments[_i];
        }
    };
    MysqlConnection.prototype.fetchDatabaseInfornation = function () {
        var def = Promise.defer();
        def.resolve();
        return (def.promise);
    };
    MysqlConnection.prototype.escape = function (val) {
        return "";
    };
    MysqlConnection.prototype.notice = function (table, query, parsedResults) {
    };
    MysqlConnection.prototype.watch = function (table, evtType, callback) {
    };
    MysqlConnection.prototype.unwatch = function (table, evtType, callbackToRemove) {
    };
    MysqlConnection.prototype.query = function (query, callback, queryArguments) {
    };
    MysqlConnection.prototype.table = function (table) {
        return new MysqlTable_1.MysqlTable('test', this);
    };
    return MysqlConnection;
})();
exports.MysqlConnection = MysqlConnection;
//# sourceMappingURL=MysqlConnection.js.map