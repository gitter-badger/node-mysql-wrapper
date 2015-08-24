var MysqlUtil_1 = require("./MysqlUtil");
var Promise = require('bluebird');
var MysqlWrapper = (function () {
    function MysqlWrapper(connection) {
        this.readyListenerCallbacks = new Array(); //()=>void
        this.setConnection(connection);
    }
    MysqlWrapper.when = function () {
        var _promises = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _promises[_i - 0] = arguments[_i];
        }
        return new Promise(function (resolve, reject) {
            //  let promises = Array.prototype.slice.call(arguments);
            if (Array.isArray(_promises[0])) {
                _promises = Array.prototype.slice.call(_promises[0]);
            } //here I check if first argument is array instead of just a function argument, Promise.all doesnt have this by default...but it should.
            Promise.all(_promises).then(function (results) {
                resolve(results);
            }).catch(function (_err) { reject(_err); });
        });
    };
    MysqlWrapper.prototype.setConnection = function (connection) {
        this.connection = connection;
    };
    MysqlWrapper.prototype.useOnly = function () {
        var useTables = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            useTables[_i - 0] = arguments[_i];
        }
        this.connection.useOnly(useTables);
    };
    MysqlWrapper.prototype.has = function (tableName, functionName) {
        if (this[tableName] !== undefined) {
            if (functionName) {
                return this[tableName][functionName] !== undefined;
            }
            else {
                return true;
            }
        }
        return false;
    };
    MysqlWrapper.prototype.ready = function (callback) {
        var _this = this;
        this.readyListenerCallbacks.push(callback);
        if (this.readyListenerCallbacks.length === 1) {
            //means the first listener,so  do the link/connect to the connection now. No before.
            this.connection.link().then(function () {
                [].forEach.call(_this.connection.tables, function (_table) {
                    _this[MysqlUtil_1.default.toObjectProperty(_table.name)] = _this[_table.name] = _table;
                });
                _this.noticeReady();
            });
        }
    };
    MysqlWrapper.prototype.table = function (tableName) {
        return this.connection.table(tableName);
    };
    MysqlWrapper.prototype.noticeReady = function () {
        for (var i = 0; i < this.readyListenerCallbacks.length; i++) {
            this.readyListenerCallbacks[i]();
        }
    };
    MysqlWrapper.prototype.removeReadyListener = function (callback) {
        for (var i = 0; i < this.readyListenerCallbacks.length; i++) {
            if (this.readyListenerCallbacks[i] === callback) {
                this.readyListenerCallbacks.slice(i, 1);
                break;
            }
        }
    };
    MysqlWrapper.prototype.query = function (queryStr, callback, queryArguments) {
        this.connection.query(queryStr, callback, queryArguments);
    };
    MysqlWrapper.prototype.destroy = function () {
        this.readyListenerCallbacks = [];
        this.connection.destroy();
    };
    MysqlWrapper.prototype.end = function (maybeAcallbackError) {
        this.readyListenerCallbacks = [];
        this.connection.end(maybeAcallbackError);
    };
    return MysqlWrapper;
})();
exports.default = MysqlWrapper;
//# sourceMappingURL=MysqlWrapper.js.map