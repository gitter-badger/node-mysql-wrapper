var Helper_1 = require("./Helper");
var SelectQueryRules_1 = require("./SelectQueryRules");
var Promise = require('bluebird');
var Wrapper = (function () {
    function Wrapper(connection) {
        this.readyListenerCallbacks = new Array();
        this.setConnection(connection);
    }
    Wrapper.when = function () {
        var _promises = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            _promises[_i - 0] = arguments[_i];
        }
        return new Promise(function (resolve, reject) {
            //  let promises = Array.prototype.slice.call(arguments);
            if (Array.isArray(_promises[0])) {
                _promises = Array.prototype.slice.call(_promises[0]);
            }
            Promise.all(_promises).then(function (results) {
                resolve(results);
            }).catch(function (_err) { reject(_err); });
        });
    };
    Wrapper.prototype.setConnection = function (connection) {
        this.connection = connection;
    };
    Wrapper.prototype.useOnly = function () {
        var useTables = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            useTables[_i - 0] = arguments[_i];
        }
        this.connection.useOnly(useTables);
    };
    Wrapper.prototype.has = function (tableName, functionName) {
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
    Wrapper.prototype.ready = function (callback) {
        var _this = this;
        this.readyListenerCallbacks.push(callback);
        if (this.readyListenerCallbacks.length === 1) {
            this.connection.link().then(function () {
                [].forEach.call(_this.connection.tables, function (_table) {
                    _this[Helper_1.default.toObjectProperty(_table.name)] = _this[_table.name] = _table;
                });
                _this.noticeReady();
            });
        }
    };
    Wrapper.prototype.table = function (tableName) {
        return this.connection.table(tableName);
    };
    Wrapper.prototype.noticeReady = function () {
        for (var i = 0; i < this.readyListenerCallbacks.length; i++) {
            this.readyListenerCallbacks[i]();
        }
    };
    Wrapper.prototype.removeReadyListener = function (callback) {
        for (var i = 0; i < this.readyListenerCallbacks.length; i++) {
            if (this.readyListenerCallbacks[i] === callback) {
                this.readyListenerCallbacks.slice(i, 1);
                break;
            }
        }
    };
    Wrapper.prototype.query = function (queryStr, callback, queryArguments) {
        this.connection.query(queryStr, callback, queryArguments);
    };
    Wrapper.prototype.destroy = function () {
        this.readyListenerCallbacks = [];
        this.connection.destroy();
    };
    Wrapper.prototype.end = function (maybeAcallbackError) {
        this.readyListenerCallbacks = [];
        this.connection.end(maybeAcallbackError);
    };
    Wrapper.prototype.newTableRules = function (tableName) {
        var tbRule = new SelectQueryRules_1.SelectQueryRules();
        this.table(tableName).rules = tbRule;
        return tbRule;
    };
    Wrapper.prototype.buildRules = function (parentRules) {
        var newRules = new SelectQueryRules_1.SelectQueryRules();
        if (parentRules) {
            newRules.from(parentRules);
        }
        return newRules;
    };
    return Wrapper;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Wrapper;
