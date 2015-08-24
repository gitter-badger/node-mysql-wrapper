var MysqlUtil_1 = require("./MysqlUtil");
var Promise = require('bluebird');
exports.EQUAL_TO_PROPERTY_SYMBOL = '=';
var MysqlTable = (function () {
    function MysqlTable(tableName, connection) {
        this.name = tableName;
        this.connection = connection;
        //edw to forEach gia ta functions tou Model.an den ta valw ola sto table, logika 9a ginete.
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
    MysqlTable.prototype.toRow = function (jsObject) {
        var _this = this;
        var _arr = new Array();
        var _columns = [];
        var _values = [];
        //'of' doesnt works for the properties.
        MysqlUtil_1.default.forEachKey(jsObject, function (key) {
            var _col = MysqlUtil_1.default.toRowProperty(key);
            //only if this key/property of object is actualy a column (except  primary key)
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
                // this.primaryKeyValue =
                returnValue = this[this.primaryKey]; //If we want the value but we dont know the of primary key's column's name.
            }
        }
        return returnValue;
    };
    MysqlTable.prototype.putTablePropertyFrom = function (mysqlTableToSearch, parentObj) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var tableProperty = MysqlUtil_1.default.toObjectProperty(mysqlTableToSearch);
            var tablePropertyObj = parentObj[tableProperty];
            MysqlUtil_1.default.forEachKey(tablePropertyObj, function (key) {
                var _val = tablePropertyObj[key];
                if (_val === exports.EQUAL_TO_PROPERTY_SYMBOL) {
                    // console.log(key + " is equal to " + parentObj[key]);
                    tablePropertyObj[key] = parentObj[key];
                }
            });
            _this.connection.table(mysqlTableToSearch).find(tablePropertyObj, function (results) {
                parentObj[tableProperty] = results;
                resolve();
            });
        });
    };
    MysqlTable.prototype.parseQueryResult = function (jsObject, result, tablesToSearch) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var _obj = {};
            MysqlUtil_1.default.forEachKey(result, function (key) {
                var propertyObjKey = MysqlUtil_1.default.toObjectProperty(key);
                _obj[propertyObjKey] = result[key];
            });
            if (tablesToSearch.length === 0) {
                // console.dir(_obj);
                resolve(_obj);
            }
            else {
                // console.dir(_obj); //ews ewd kala paei
                var promisesList = [];
                [].forEach.call(tablesToSearch, function (tableToSearch) {
                    //apo edw kai pera den teleiwnei pote i fasi ....
                    var tableToSearchProp = MysqlUtil_1.default.toObjectProperty(tableToSearch);
                    _obj[tableToSearchProp] = jsObject[tableToSearchProp];
                    //  console.dir(_obj);
                    //edw to obj ginete o,ti nane ...na to dw
                    promisesList.push(_this.putTablePropertyFrom(tableToSearch, _obj));
                });
                //console.log(promisesList.length);    //edw sunexeia dixnei... den stamataei pote.
                Promise.all(promisesList).then(function (_val) {
                    resolve(_obj);
                }).catch(function (err) {
                    reject("Error when parsing the object from table.");
                });
            }
        });
    };
    //toFind fernei to all, alla otan uparxoun '=' gamiete den ta fernei swsta prepei na to dw
    MysqlTable.prototype.find = function (jsObject, callback) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var colsToSearch = [];
            var tablesToSearch = [];
            var noDbProperties = [];
            MysqlUtil_1.default.forEachKey(jsObject, function (objectKey) {
                var colName = MysqlUtil_1.default.toRowProperty(objectKey);
                if (_this.columns.indexOf(colName) !== -1 || _this.primaryKey === colName) {
                    colsToSearch.push(colName + " = " + _this.connection.escape(jsObject[objectKey]));
                }
                else {
                    if (_this.connection.table(colName) !== undefined) {
                        tablesToSearch.push(colName);
                    }
                    else {
                        noDbProperties.push(objectKey);
                    }
                }
            });
            var whereParameterStr = "";
            if (colsToSearch.length > 0) {
                whereParameterStr = " WHERE " + colsToSearch.join(" AND ");
            }
            var _query = ("SELECT * FROM " + _this.name + whereParameterStr);
            _this.connection.query(_query, function (err, results) {
                if (err || !results) {
                    reject(err);
                }
                console.log(_query);
                var resultsPromises = [];
                //   console.dir(results);    //infinity loop...without reason lol
                [].forEach.call(results, function (result) {
                    console.log('push parseResult from table: ' + _this.name + ' from result: ');
                    console.dir(result);
                    console.log(' the jsobject: ');
                    console.dir(jsObject);
                    console.log('and tables to search: ' + tablesToSearch.toString());
                    resultsPromises.push(_this.parseQueryResult(jsObject, result, tablesToSearch));
                });
                Promise.all(resultsPromises).then(function (_objects) {
                    //   console.log('finish? ');   //infinity loop...without reason lol
                    if (noDbProperties.length > 0) {
                        [].forEach.call(_objects, function (theObj) {
                            for (var pr = 0; pr < noDbProperties.length; pr++) {
                                theObj[noDbProperties[pr]] = jsObject[noDbProperties[pr]];
                            }
                        });
                    }
                    //console.dir(_objects);
                    if (callback) {
                        callback(_objects);
                    }
                    resolve(_objects);
                });
            });
        });
    };
    MysqlTable.prototype.findAll = function (callback) {
        return this.find({}, callback);
    };
    MysqlTable.prototype.find2 = function (criteria, callback) {
        /*criteria from users =   {
        yearsOld: 22,
        userInfos: { userId: '=' },
        comments: {
            userId: '=',
            commentLikes: {
                commentId: '=',
                users: { userId: '=' }
            }
        }
    }*/
        var _this = this;
        var def = Promise.defer();
        var colsToSearch = [];
        var tablesToSearch = [];
        var noDbProperties = [];
        var manySelectQuery = "";
        MysqlUtil_1.default.forEachKey(criteria, function (objectKey) {
            if (criteria.hasOwnProperty(objectKey)) {
                var colName = MysqlUtil_1.default.toRowProperty(objectKey);
                if (_this.columns.indexOf(colName) !== -1 || _this.primaryKey === colName) {
                    colsToSearch.push(colName + " = " + _this.connection.escape(criteria[objectKey]));
                }
                else {
                    if (_this.connection.table(colName) !== undefined) {
                        tablesToSearch.push(colName);
                    }
                    else {
                        noDbProperties.push(objectKey);
                    }
                }
            }
        });
        var whereParameterStr = "";
        if (colsToSearch.length > 0) {
            whereParameterStr = " WHERE " + colsToSearch.join(" AND ");
        }
        var _query = ("SELECT * FROM " + this.name + whereParameterStr);
        this.connection.query(_query, function (err, results) {
            if (err || !results) {
                def.reject(err);
                return;
            }
            //edw exoume to users list logika.
            results.forEach(function (result) {
                var _obj = {};
                if (noDbProperties.length > 0) {
                    for (var i = 0; i < noDbProperties.length; i++) {
                        result[noDbProperties[i]] = criteria[noDbProperties[i]];
                    }
                }
                if (tablesToSearch.length > 0) {
                    var otherFindPromises = [];
                    tablesToSearch.forEach(function (_tableToSearch) {
                        var subCriteriaObjectPropertyname = MysqlUtil_1.default.toObjectProperty(_tableToSearch);
                        var subCriteria = criteria[subCriteriaObjectPropertyname];
                        MysqlUtil_1.default.forEachKey(subCriteria, function (subCriteriaKey) {
                            var resultColumnRowName = MysqlUtil_1.default.toRowProperty(subCriteriaKey);
                            if (result.hasOwnProperty(resultColumnRowName)) {
                                subCriteria[subCriteriaKey] = result[resultColumnRowName];
                            }
                        });
                        //ws edw exoume
                        var subTable = _this.connection.table(_tableToSearch);
                        var subFindPromise = subTable.find2(subCriteria);
                        otherFindPromises.push(subFindPromise);
                        subFindPromise.then(function (_subResults) {
                            result[subCriteriaObjectPropertyname] = _subResults;
                        });
                        //   console.dir(subCriteria);
                        //    console.log(" inside " + subTable.name);
                    });
                    Promise.all(otherFindPromises).then(function (allFindResults) {
                        console.dir(result);
                        if (callback) {
                            callback(result);
                        }
                        def.resolve(result);
                    });
                }
                else {
                    if (callback) {
                        callback(results);
                    }
                    def.resolve(results);
                }
            });
        });
        return def.promise;
    };
    MysqlTable.prototype.save = function (jsObject, callback) {
        var _this = this;
        //sta arguments borw na perniounte ta values me tin seira, ton properties pou exei to model-jsObject
        return new Promise(function (resolve, reject) {
            var primaryKeyValue = _this.getPrimaryKeyValue(jsObject);
            //14-08-2015 always run toRow before save.  if (this.columns.length === 0 || this.values.length === 0) {
            var arr = _this.toRow(jsObject);
            var objectColumns = arr[0]; // = columns , 1= values
            var objectValues = arr[1];
            //   }
            if (primaryKeyValue > 0) {
                //update
                var colummnsAndValuesStr = "";
                for (var i = 0; i < objectColumns.length; i++) {
                    colummnsAndValuesStr += "," + objectColumns[i] + "=" + _this.connection.escape(objectValues[i]);
                }
                colummnsAndValuesStr = colummnsAndValuesStr.substring(1);
                var _query = "UPDATE " + _this.name + " SET " + colummnsAndValuesStr + " WHERE " + _this.primaryKey + " =  " + primaryKeyValue;
                _this.connection.query(_query, function (err, result) {
                    if (err) {
                        // console.dir(err);
                        reject(err);
                    }
                    _this.connection.notice(_this.name, _query, jsObject);
                    resolve(jsObject);
                    if (callback) {
                        callback(jsObject); //an kai kanonika auto to kanei mono t
                    }
                });
            }
            else {
                //create
                var _query = "INSERT INTO ?? (??) VALUES(?) ";
                _this.connection.query(_query, function (err, result) {
                    if (err) {
                        reject(err);
                    }
                    // jsObject[this.primaryKey] = result.insertId;
                    var primaryKeyJsObjectProperty = MysqlUtil_1.default.toObjectProperty(_this.primaryKey);
                    jsObject[primaryKeyJsObjectProperty] = result.insertId;
                    primaryKeyValue = result.insertId;
                    _this.connection.notice(_this.name, _query, jsObject);
                    resolve(jsObject);
                    if (callback) {
                        callback(jsObject);
                    }
                }, [_this.name, objectColumns, objectValues]);
            }
        });
    };
    MysqlTable.prototype.safeRemove = function (jsObject, callback) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var primaryKeyValue = _this.getPrimaryKeyValue(jsObject);
            if (primaryKeyValue <= 0) {
                reject('Primary Key is missing!');
            }
            var _query = "DELETE FROM " + _this.name + " WHERE " + _this.primaryKey + " = " + primaryKeyValue;
            _this.connection.query(_query, function (err, result) {
                if (err) {
                    // console.dir(err);
                    reject(err);
                }
                jsObject.affectedRows = result.affectedRows;
                _this.connection.notice(_this.name, _query, jsObject);
                resolve(jsObject);
                if (callback) {
                    callback(jsObject); //an kai kanonika auto to kanei mono t
                }
            });
        });
    };
    MysqlTable.prototype.remove = function (jsObject, callback) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var primaryKeyValue = _this.getPrimaryKeyValue(jsObject);
            if (!primaryKeyValue || primaryKeyValue <= 0) {
                var arr = _this.toRow(jsObject);
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
                        //console.dir(err);
                        reject(err);
                    }
                    jsObject.affectedRows = result.affectedRows;
                    _this.connection.notice(_this.name, _query, jsObject);
                    resolve(jsObject);
                    if (callback) {
                        callback(jsObject); //an kai kanonika auto to kanei mono t
                    }
                });
            }
            else {
                // return this.safeRemove(jsObject);
                _this.safeRemove(jsObject).then(function (_res) {
                    resolve(_res);
                });
            }
        });
    };
    return MysqlTable;
})();
exports.default = MysqlTable;
//# sourceMappingURL=MysqlTable.js.map