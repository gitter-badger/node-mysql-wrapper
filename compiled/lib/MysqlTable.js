var MysqlUtil_1 = require("./MysqlUtil");
var SelectQueryRules_1 = require("./SelectQueryRules");
var CriteriaBuilder_1 = require("./CriteriaBuilder");
var Promise = require('bluebird');
exports.EQUAL_TO_PROPERTY_SYMBOL = '=';
var MysqlTable = (function () {
    function MysqlTable(tableName, connection) {
        this._name = tableName;
        this._connection = connection;
        this._criteriaBuilder = new CriteriaBuilder_1.CriteriaBuilder(this);
        this._rules = new SelectQueryRules_1.SelectQueryRules();
    }
    Object.defineProperty(MysqlTable.prototype, "columns", {
        get: function () {
            return this._columns;
        },
        set: function (cols) {
            this._columns = cols;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MysqlTable.prototype, "primaryKey", {
        get: function () {
            return this._primaryKey;
        },
        set: function (prkey) {
            this._primaryKey = prkey;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MysqlTable.prototype, "connection", {
        get: function () {
            return this._connection;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MysqlTable.prototype, "name", {
        get: function () {
            return this._name;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MysqlTable.prototype, "rules", {
        get: function () {
            return this._rules;
        },
        set: function (_rules) {
            this._rules = _rules;
        },
        enumerable: true,
        configurable: true
    });
    MysqlTable.prototype.on = function (evtType, callback) {
        this.connection.watch(this.name, evtType, callback);
    };
    MysqlTable.prototype.off = function (evtType, callbackToRemove) {
        this.connection.unwatch(this.name, evtType, callbackToRemove);
    };
    MysqlTable.prototype.has = function (extendedFunctionName) {
        return this[extendedFunctionName] !== undefined;
    };
    MysqlTable.prototype.extend = function (functionName, theFunction) {
        var isFunction = !!(theFunction && theFunction.constructor && theFunction.call && theFunction.apply);
        if (isFunction) {
            this[functionName] = theFunction;
        }
    };
    MysqlTable.prototype.objectFromRow = function (row) {
        var _this = this;
        var obj = {};
        MysqlUtil_1.default.forEachKey(row, function (key) {
            if (_this.columns.indexOf(key) !== -1 || _this.primaryKey === key) {
                obj[MysqlUtil_1.default.toObjectProperty(key)] = row[key];
            }
            else {
                obj[key] = row[key];
            }
        });
        return obj;
    };
    MysqlTable.prototype.rowFromObject = function (obj) {
        var _this = this;
        var row = {};
        MysqlUtil_1.default.forEachKey(obj, function (key) {
            var rowKey = MysqlUtil_1.default.toRowProperty(key);
            if (_this.columns.indexOf(rowKey) !== -1 || _this.primaryKey === rowKey) {
                row[rowKey] = obj[key];
            }
        });
        return row;
    };
    MysqlTable.prototype.getRowAsArray = function (jsObject) {
        var _this = this;
        var _arr = new Array();
        var _columns = [];
        var _values = [];
        MysqlUtil_1.default.forEachKey(jsObject, function (key) {
            var _col = MysqlUtil_1.default.toRowProperty(key);
            if (_this.columns.indexOf(_col) !== -1) {
                _columns.push(_col);
                _values.push(jsObject[key]);
            }
        });
        _arr.push(_columns);
        _arr.push(_values);
        return _arr;
    };
    MysqlTable.prototype.getPrimaryKeyValue = function (jsObject) {
        var returnValue = 0;
        var primaryKeyObjectProperty = MysqlUtil_1.default.toObjectProperty(this.primaryKey);
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
    MysqlTable.prototype.parseQueryResult = function (result, criteria) {
        var _this = this;
        return new Promise(function (resolve) {
            var obj = _this.objectFromRow(result);
            if (criteria.tables.length > 0) {
                var tableFindPromiseList = [];
                criteria.tables.forEach(function (tableName) {
                    var table = _this.connection.table(tableName);
                    var tablePropertyName = MysqlUtil_1.default.toObjectProperty(tableName);
                    var criteriaJsObject = MysqlUtil_1.default.copyObject(criteria.rawCriteriaObject[tablePropertyName]);
                    MysqlUtil_1.default.forEachKey(criteriaJsObject, function (propertyName) {
                        if (criteriaJsObject[propertyName] === exports.EQUAL_TO_PROPERTY_SYMBOL) {
                            criteriaJsObject[propertyName] = result[MysqlUtil_1.default.toRowProperty(propertyName)];
                        }
                    });
                    var tableFindPromise = table.find(criteriaJsObject);
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
    MysqlTable.prototype.find = function (criteriaRawJsObject, rulesOrCallback, secondCallbackIfNoFirst) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var criteria = _this._criteriaBuilder.build(criteriaRawJsObject);
            var queryRules = _this._rules.toString();
            if (rulesOrCallback !== undefined && !MysqlUtil_1.default.isFunction(rulesOrCallback)) {
                queryRules = rulesOrCallback.toString();
            }
            var query = "SELECT * FROM " + _this.name + criteria.whereClause + queryRules;
            _this.connection.query(query, function (error, results) {
                if (error || !results) {
                    reject(error + ' Error. On find');
                }
                var parseQueryResultsPromises = [];
                results.forEach(function (result) {
                    parseQueryResultsPromises.push(_this.parseQueryResult(result, criteria));
                });
                Promise.all(parseQueryResultsPromises).then(function (_objects) {
                    var callback = undefined;
                    if (rulesOrCallback !== undefined && MysqlUtil_1.default.isFunction(rulesOrCallback)) {
                        callback = rulesOrCallback;
                    }
                    else if (secondCallbackIfNoFirst !== undefined) {
                        callback = secondCallbackIfNoFirst;
                    }
                    if (callback !== undefined) {
                        callback(_objects);
                    }
                    resolve(_objects);
                });
            });
        });
    };
    MysqlTable.prototype.findById = function (id, callback) {
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
    MysqlTable.prototype.findAll = function (rulesOrCallback, secondCallbackIfNoFirst) {
        if (rulesOrCallback !== undefined && !MysqlUtil_1.default.isFunction(rulesOrCallback)) {
            var _rules = rulesOrCallback;
            return this.find({}, _rules, secondCallbackIfNoFirst);
        }
        else if (rulesOrCallback !== undefined) {
            var _cb = rulesOrCallback;
            return this.find({}, _cb);
        }
        else {
            return this.find({});
        }
    };
    MysqlTable.prototype.save = function (criteriaRawJsObject, callback) {
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
                    var primaryKeyJsObjectProperty = MysqlUtil_1.default.toObjectProperty(_this.primaryKey);
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
    MysqlTable.prototype.safeRemove = function (id, callback) {
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
    MysqlTable.prototype.remove = function (criteriaRawJsObject, callback) {
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
    return MysqlTable;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MysqlTable;
