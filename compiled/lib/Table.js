var Helper_1 = require("./Helper");
var CriteriaDivider_1 = require("./CriteriaDivider");
var SelectQueryRules_1 = require("./queries/SelectQueryRules");
var SelectQuery_1 = require("./queries/SelectQuery");
var SaveQuery_1 = require("./queries/SaveQuery");
var DeleteQuery_1 = require("./queries/DeleteQuery");
var CriteriaBuilder_1 = require("./CriteriaBuilder");
var Promise = require('bluebird');
var Table = (function () {
    function Table(tableName, connection) {
        this._name = tableName;
        this._connection = connection;
        this._criteriaDivider = new CriteriaDivider_1.CriteriaDivider(this);
        this._rules = new SelectQueryRules_1.SelectQueryRules();
        this._selectQuery = new SelectQuery_1.default(this);
        this._saveQuery = new SaveQuery_1.default(this);
        this._deleteQuery = new DeleteQuery_1.default(this);
    }
    Object.defineProperty(Table.prototype, "columns", {
        get: function () {
            return this._columns;
        },
        set: function (cols) {
            this._columns = cols;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Table.prototype, "primaryKey", {
        get: function () {
            return this._primaryKey;
        },
        set: function (prkey) {
            this._primaryKey = prkey;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Table.prototype, "connection", {
        get: function () {
            return this._connection;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Table.prototype, "name", {
        get: function () {
            return this._name;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Table.prototype, "rules", {
        get: function () {
            return this._rules;
        },
        set: function (_rules) {
            this._rules = _rules;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Table.prototype, "criteriaDivider", {
        get: function () {
            return this._criteriaDivider;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Table.prototype, "criteria", {
        get: function () {
            return new CriteriaBuilder_1.default(this);
        },
        enumerable: true,
        configurable: true
    });
    Table.prototype.on = function (evtType, callback) {
        this.connection.watch(this.name, evtType, callback);
    };
    Table.prototype.off = function (evtType, callbackToRemove) {
        this.connection.unwatch(this.name, evtType, callbackToRemove);
    };
    Table.prototype.has = function (extendedFunctionName) {
        return this[extendedFunctionName] !== undefined;
    };
    Table.prototype.extend = function (functionName, theFunction) {
        var isFunction = !!(theFunction && theFunction.constructor && theFunction.call && theFunction.apply);
        if (isFunction) {
            this[functionName] = theFunction;
        }
    };
    Table.prototype.objectFromRow = function (row) {
        var _this = this;
        var obj = {};
        Helper_1.default.forEachKey(row, function (key) {
            if (_this.columns.indexOf(key) !== -1 || _this.primaryKey === key) {
                obj[Helper_1.default.toObjectProperty(key)] = row[key];
            }
            else {
                obj[key] = row[key];
            }
        });
        return obj;
    };
    Table.prototype.rowFromObject = function (obj) {
        var _this = this;
        var row = {};
        Helper_1.default.forEachKey(obj, function (key) {
            var rowKey = Helper_1.default.toRowProperty(key);
            if (_this.columns.indexOf(rowKey) !== -1 || _this.primaryKey === rowKey) {
                row[rowKey] = obj[key];
            }
        });
        return row;
    };
    Table.prototype.getRowAsArray = function (jsObject) {
        var _this = this;
        var _arr = new Array();
        var _columns = [];
        var _values = [];
        Helper_1.default.forEachKey(jsObject, function (key) {
            var _col = Helper_1.default.toRowProperty(key);
            if (_this.columns.indexOf(_col) !== -1) {
                _columns.push(_col);
                _values.push(jsObject[key]);
            }
        });
        _arr.push(_columns);
        _arr.push(_values);
        return _arr;
    };
    Table.prototype.getPrimaryKeyValue = function (jsObject) {
        var returnValue = 0;
        var primaryKeyObjectProperty = Helper_1.default.toObjectProperty(this.primaryKey);
        if (jsObject) {
            if (jsObject.constructor === Array) {
            }
            else {
                if (jsObject.hasOwnProperty(primaryKeyObjectProperty)) {
                    this[this.primaryKey] = jsObject[primaryKeyObjectProperty];
                }
                else {
                    this[this.primaryKey] = 0;
                }
                returnValue = this[this.primaryKey];
            }
        }
        return returnValue;
    };
    Table.prototype.find = function (criteriaRawJsObject, callback) {
        return this._selectQuery.execute(criteriaRawJsObject, callback);
    };
    Table.prototype.findSingle = function (criteriaRawJsObject, callback) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.find(criteriaRawJsObject).then(function (results) {
                resolve(results[0]);
                if (callback) {
                    callback(results[0]);
                }
            });
        });
    };
    Table.prototype.findById = function (id, callback) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var criteria = {};
            criteria[_this.primaryKey] = id;
            _this.find(criteria).then(function (results) {
                resolve(results[0]);
                if (callback) {
                    callback(results[0]);
                }
            }).catch(function (err) { return reject(err); });
        });
    };
    Table.prototype.findAll = function (tableRules, callback) {
        var _obj = {};
        if (tableRules !== undefined) {
            _obj[SelectQueryRules_1.TABLE_RULES_PROPERTY] = tableRules;
        }
        return this.find(_obj, callback);
    };
    Table.prototype.save = function (criteriaRawJsObject, callback) {
        return this._saveQuery.execute(criteriaRawJsObject, callback);
    };
    Table.prototype.remove = function (criteriaOrID, callback) {
        return this._deleteQuery.execute(criteriaOrID, callback);
    };
    return Table;
})();
exports.default = Table;
