exports.EQUAL_TO_PROPERTY_SYMBOL = '=';
var MysqlTable = (function () {
    function MysqlTable(tableName, connection) {
        this.name = tableName;
        this.connection = connection;
        //edw to forEach gia ta functions tou Model.an den ta valw ola sto table, logika 9a ginete.
    }
    MysqlTable.toObjectProperty = function (columnKey) {
        //convert column_key to objectKey
        return columnKey.replace(/(_.)/g, function (x) { return x[1].toUpperCase(); });
    };
    MysqlTable.toRowProperty = function (objectKey) {
        //convert objectKey to column_key
        return objectKey.replace(/([A-Z]+)/g, "_$1").replace(/^_/, "").toLowerCase();
    };
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
        var arr = new Array();
        var columns = [];
        var values = [];
        for (var key in jsObject) {
            var _col = MysqlTable.toRowProperty(key);
            //only if this key/property of object is actualy a column (except  primary key)
            if (this.columns.indexOf(_col) !== -1) {
                columns.push(_col);
                values.push(jsObject[key]);
            }
        }
        arr.push(columns);
        arr.push(values);
        return arr;
    };
    MysqlTable.prototype.getPrimaryKeyValue = function (jsObject) {
        var returnValue = 0;
        var primaryKeyObjectProperty = MysqlTable.toObjectProperty(this.primaryKey);
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
        var def = Promise.defer();
        var tableProperty = MysqlTable.toObjectProperty(mysqlTableToSearch);
        var tablePropertyObj = parentObj[tableProperty];
        for (var _i = 0; _i < tablePropertyObj.length; _i++) {
            var key = tablePropertyObj[_i];
            var _val = tablePropertyObj[key];
            if (_val === exports.EQUAL_TO_PROPERTY_SYMBOL) {
                tablePropertyObj[key] = parentObj[key];
            }
        }
        this.find(parentObj).then(function (results) {
            parentObj[tableProperty] = results;
            def.resolve();
        });
        return def.promise;
    };
    MysqlTable.prototype.parseQueryResult = function (jsObject, result, tablesToSearch) {
        var def = Promise.defer();
        var _obj = {};
        var self = this;
        for (var _i = 0; _i < result.length; _i++) {
            var key = result[_i];
            var propertyObjKey = MysqlTable.toObjectProperty(key);
            _obj[propertyObjKey] = result[key];
        }
        if (tablesToSearch.length === 0) {
            def.resolve(_obj);
        }
        else {
            var promisesList = [];
            [].forEach.call(tablesToSearch, function (tableToSearch) {
                var tableToSearchProp = MysqlTable.toObjectProperty(tableToSearch);
                _obj = jsObject[tableToSearchProp] = jsObject[tableToSearchProp];
                promisesList.push(self.putTablePropertyFrom(tableToSearch, _obj));
                Promise.all(promisesList).then(function () {
                    def.resolve(_obj);
                }).error(function () {
                    def.reject("Error when parsing the object from table.");
                });
            });
        }
        return def.promise;
    };
    MysqlTable.prototype.find = function (jsObject) {
        var _this = this;
        var def = Promise.defer();
        var colsToSearch = [];
        var tablesToSearch = [];
        var noDbProperties = [];
        var manySelectQuery = "";
        for (var _i = 0; _i < jsObject.length; _i++) {
            var objectKey = jsObject[_i];
            var colName = MysqlTable.toRowProperty(objectKey);
            if (this.columns.indexOf(colName) !== -1 || this.primaryKey === colName) {
                colsToSearch.push(colName + " = " + this.connection.escape(jsObject[objectKey]));
            }
            else {
                if (this.connection.table(colName) !== undefined) {
                    tablesToSearch.push(colName);
                }
                else {
                    noDbProperties.push(objectKey);
                }
            }
        }
        var whereParameterStr = "";
        if (colsToSearch.length > 0) {
            whereParameterStr = " WHERE " + colsToSearch.join(" AND ");
        }
        var _query = ("SELECT * FROM " + this.name + whereParameterStr);
        this.connection.query(_query, function (err, results) {
            if (err || !results) {
                def.reject(err);
            }
            var resultsPromises = [];
            [].forEach.call(results, function (result) {
                resultsPromises.push(_this.parseQueryResult(jsObject, result, tablesToSearch));
            });
            Promise.all(resultsPromises).then(function (_objects) {
                if (noDbProperties.length > 0) {
                    [].forEach.call(_objects, function (theObj) {
                        for (var pr = 0; pr < noDbProperties.length; pr++) {
                            theObj[noDbProperties[pr]] = jsObject[noDbProperties[pr]];
                        }
                    });
                }
                def.resolve(_objects);
            });
        });
        return def.promise;
    };
    MysqlTable.prototype.findAll = function () { return this.find({}); };
    MysqlTable.prototype.save = function (jsObject) {
        var _this = this;
        //sta arguments borw na perniounte ta values me tin seira, ton properties pou exei to model-jsObject 
        var def = Promise.defer();
        var primaryKeyValue = this.getPrimaryKeyValue(jsObject);
        //14-08-2015 always run toRow before save.  if (this.columns.length === 0 || this.values.length === 0) {
        var arr = this.toRow(jsObject);
        var objectColumns = arr[0]; // = columns , 1= values
        var objectValues = arr[1];
        //   }
        if (primaryKeyValue > 0) {
            //update
            var colummnsAndValuesStr = "";
            for (var i = 0; i < objectColumns.length; i++) {
                colummnsAndValuesStr += "," + objectColumns[i] + "=" + this.connection.escape(objectValues[i]);
            }
            colummnsAndValuesStr = colummnsAndValuesStr.substring(1);
            var _query = "UPDATE " + this.name + " SET " + colummnsAndValuesStr + " WHERE " + this.primaryKey + " =  " + primaryKeyValue;
            this.connection.query(_query, function (err, result) {
                if (err) {
                    console.dir(err);
                    def.reject(err);
                }
                _this.connection.notice(_this.name, _query, jsObject);
                def.resolve(jsObject);
            });
        }
        else {
            //create
            var _query = "INSERT INTO ?? (??) VALUES(?) ";
            this.connection.query(_query, function (err, result) {
                if (err) {
                    console.dir(err);
                    def.reject(err);
                }
                // jsObject[this.primaryKey] = result.insertId;
                var primaryKeyJsObjectProperty = MysqlTable.toObjectProperty(_this.primaryKey);
                jsObject[primaryKeyJsObjectProperty] = result.insertId;
                primaryKeyValue = result.insertId;
                _this.connection.notice(_this.name, _query, jsObject);
                def.resolve(jsObject);
            }, [this.name, objectColumns, objectValues]);
        }
        return def.promise;
    };
    MysqlTable.prototype.safeRemove = function (jsObject) {
        var _this = this;
        var def = Promise.defer();
        var primaryKeyValue = this.getPrimaryKeyValue(jsObject);
        if (primaryKeyValue <= 0) {
            def.reject('Primary Key is missing!');
        }
        var _query = "DELETE FROM " + this.name + " WHERE " + this.primaryKey + " = " + primaryKeyValue;
        this.connection.query(_query, function (err, result) {
            if (err) {
                console.dir(err);
                def.reject(err);
            }
            jsObject.affectedRows = result.affectedRows;
            _this.connection.notice(_this.name, _query, jsObject);
            def.resolve(jsObject);
        });
        return def.promise;
    };
    MysqlTable.prototype.remove = function (jsObject) {
        var _this = this;
        var def = Promise.defer();
        var primaryKeyValue = this.getPrimaryKeyValue(jsObject);
        if (!primaryKeyValue || primaryKeyValue <= 0) {
            var arr = this.toRow(jsObject);
            var objectValues = arr[1];
            var colummnsAndValues = [];
            for (var i = 0; i < colummnsAndValues.length; i++) {
                colummnsAndValues.push(colummnsAndValues[i] + "=" + this.connection.escape(objectValues[i]));
            }
            if (colummnsAndValues.length === 0) {
                def.reject('No criteria found in model! ');
            }
            var _query = "DELETE FROM " + this.name + " WHERE " + colummnsAndValues.join(' AND ');
            this.connection.query(_query, function (err, result) {
                if (err) {
                    console.dir(err);
                    def.reject(err);
                }
                jsObject.affectedRows = result.affectedRows;
                _this.connection.notice(_this.name, _query, jsObject);
                def.resolve(jsObject);
            });
        }
        else {
            return this.safeRemove(jsObject);
        }
        return def.promise;
    };
    return MysqlTable;
})();
exports.MysqlTable = MysqlTable;
//# sourceMappingURL=MysqlTable.js.map