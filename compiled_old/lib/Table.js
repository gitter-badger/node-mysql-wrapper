var Promise = require('bluebird');
var Helper_1 = require("./Helper");
var SelectQuery_1 = require("./SelectQuery");
var SelectQueryRules_1 = require("./SelectQueryRules");
var CriteriaBuilder_1 = require("./CriteriaBuilder");
exports.EQUAL_TO_PROPERTY_SYMBOL = '=';
var Table = (function () {
    function Table(tableName, connection) {
        this._name = tableName;
        this._connection = connection;
        this._criteriaBuilder = new CriteriaBuilder_1.CriteriaBuilder(this);
        this._rules = new SelectQueryRules_1.SelectQueryRules();
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
    Object.defineProperty(Table.prototype, "criteriaBuilder", {
        get: function () {
            return this._criteriaBuilder;
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
    Table.prototype.parseQueryResult = function (result, criteria) {
        var _this = this;
        return new Promise(function (resolve) {
            var obj = _this.objectFromRow(result);
            if (criteria.tables.length > 0) {
                var tableFindPromiseList = [];
                criteria.tables.forEach(function (tableName) {
                    var table = _this.connection.table(tableName);
                    var tablePropertyName = Helper_1.default.toObjectProperty(tableName);
                    var criteriaJsObject = Helper_1.default.copyObject(criteria.rawCriteriaObject[tablePropertyName]);
                    Helper_1.default.forEachKey(criteriaJsObject, function (propertyName) {
                        if (criteriaJsObject[propertyName] === exports.EQUAL_TO_PROPERTY_SYMBOL) {
                            criteriaJsObject[propertyName] = result[Helper_1.default.toRowProperty(propertyName)];
                        }
                    });
                    var tableFindPromise = table.find(criteriaJsObject).promise();
                    tableFindPromise.then(function (childResults) {
                        obj[tablePropertyName] = [];
                        childResults.forEach(function (childResult) {
                            obj[tablePropertyName].push(_this.objectFromRow(childResult));
                        });
                    });
                    tableFindPromiseList.push(tableFindPromise);
                });
                Promise.all(tableFindPromiseList).then(function () {
                    resolve(obj);
                });
            }
            else {
                resolve(obj);
            }
        });
    };
    Table.prototype.find = function (criteriaRawJsObject, callback) {
        return new SelectQuery_1.default(this, criteriaRawJsObject, callback);
    };
    Table.prototype.select = function (callback) {
        return new SelectQuery_1.SelectQueryWhere(this, callback);
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
    Table.prototype.findAll = function (callback) {
        return this.find({}, callback);
    };
    Table.prototype.save = function (criteriaRawJsObject, callback) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var primaryKeyValue = _this.getPrimaryKeyValue(criteriaRawJsObject);
            var arr = _this.getRowAsArray(criteriaRawJsObject);
            var objectColumns = arr[0];
            var objectValues = arr[1];
            var obj = _this.objectFromRow(criteriaRawJsObject);
            if (primaryKeyValue > 0) {
                var colummnsAndValuesStr = "";
                for (var i = 0; i < objectColumns.length; i++) {
                    colummnsAndValuesStr += "," + objectColumns[i] + "=" + _this.connection.escape(objectValues[i]);
                }
                colummnsAndValuesStr = colummnsAndValuesStr.substring(1);
                var _query = "UPDATE " + _this.name + " SET " + colummnsAndValuesStr + " WHERE " + _this.primaryKey + " =  " + primaryKeyValue;
                _this.connection.query(_query, function (err, result) {
                    if (err) {
                        reject(err);
                    }
                    _this.connection.notice(_this.name, _query, obj);
                    resolve(obj);
                    if (callback) {
                        callback(obj);
                    }
                });
            }
            else {
                var _query = "INSERT INTO ?? (??) VALUES(?) ";
                _this.connection.query(_query, function (err, result) {
                    if (err) {
                        reject(err);
                    }
                    var primaryKeyJsObjectProperty = Helper_1.default.toObjectProperty(_this.primaryKey);
                    obj[primaryKeyJsObjectProperty] = result.insertId;
                    primaryKeyValue = result.insertId;
                    _this.connection.notice(_this.name, _query, obj);
                    resolve(obj);
                    if (callback) {
                        callback(obj);
                    }
                }, [_this.name, objectColumns, objectValues]);
            }
        });
    };
    Table.prototype.safeRemove = function (id, callback) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var _query = "DELETE FROM " + _this.name + " WHERE " + _this.primaryKey + " = " + id;
            _this.connection.query(_query, function (err, result) {
                if (err) {
                    reject(err);
                }
                var _objReturned = { affectedRows: result.affectedRows, table: _this.name };
                _this.connection.notice(_this.name, _query, [_objReturned]);
                resolve(_objReturned);
                if (callback) {
                    callback(_objReturned);
                }
            });
        });
    };
    Table.prototype.remove = function (criteriaRawJsObject, callback) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var primaryKeyValue = _this.getPrimaryKeyValue(criteriaRawJsObject);
            if (!primaryKeyValue || primaryKeyValue <= 0) {
                var arr = _this.getRowAsArray(criteriaRawJsObject);
                var objectValues = arr[1];
                var colummnsAndValues = [];
                for (var i = 0; i < colummnsAndValues.length; i++) {
                    colummnsAndValues.push(colummnsAndValues[i] + "=" + _this.connection.escape(objectValues[i]));
                }
                if (colummnsAndValues.length === 0) {
                    reject('No criteria found in model! ');
                }
                var _query = "DELETE FROM " + _this.name + " WHERE " + colummnsAndValues.join(' AND ');
                _this.connection.query(_query, function (err, result) {
                    if (err) {
                        reject(err);
                    }
                    var _objReturned = { affectedRows: result.affectedRows, table: _this.name };
                    _this.connection.notice(_this.name, _query, [_objReturned]);
                    resolve(_objReturned);
                    if (callback) {
                        callback(_objReturned);
                    }
                });
            }
            else {
                _this.safeRemove(criteriaRawJsObject).then(function (_res) {
                    resolve(_res);
                });
            }
        });
    };
    return Table;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Table;
