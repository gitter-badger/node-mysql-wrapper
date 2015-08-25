var MysqlUtil_1 = require("./MysqlUtil");
var CriteriaBuilder_1 = require("./CriteriaBuilder");
var Promise = require('bluebird');
exports.EQUAL_TO_PROPERTY_SYMBOL = '=';
//skopos tou find  edw tha einai ta criteria na min allazoun na min metatreponte, kai na epistrefonte mono new objects.
var MysqlTable = (function () {
    function MysqlTable(tableName, connection) {
        this._name = tableName;
        this._connection = connection;
        this._criteriaBuilder = new CriteriaBuilder_1.CriteriaBuilder(this);
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
            if (_this.columns.indexOf(key) !== -1) {
                obj[MysqlUtil_1.default.toObjectProperty(key)] = row[key];
            }
            else {
                obj[key] = row[key]; //for no db properties.
            }
        });
        return obj;
    };
    MysqlTable.prototype.rowFromObject = function (obj) {
        var _this = this;
        var row = {};
        MysqlUtil_1.default.forEachKey(obj, function (key) {
            var rowKey = MysqlUtil_1.default.toRowProperty(key);
            if (_this.columns.indexOf(rowKey) !== -1) {
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
    MysqlTable.prototype.find = function (criteriaJsObject, callback) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var criteria = _this._criteriaBuilder.build(criteriaJsObject);
            var _query = ("SELECT * FROM " + _this.name + criteria.whereClause);
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
                    console.dir(criteriaJsObject);
                    console.log('and tables to search: ' + criteria.tables.toString());
                    resultsPromises.push(_this.parseQueryResult(criteriaJsObject, result, criteria.tables));
                });
                Promise.all(resultsPromises).then(function (_objects) {
                    //   console.log('finish? ');   //infinity loop...without reason lol
                    if (criteria.noDatabaseProperties.length > 0) {
                        [].forEach.call(_objects, function (theObj) {
                            for (var pr = 0; pr < criteria.noDatabaseProperties.length; pr++) {
                                theObj[criteria.noDatabaseProperties[pr]] = criteriaJsObject[criteria.noDatabaseProperties[pr]];
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
    MysqlTable.prototype.findById = function (id, callback) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var criteria = {};
            criteria[_this.primaryKey] = id;
            _this.find(criteria).then(function (results) { return resolve(results[0]); }).catch(function (err) { return reject(err); });
        });
    };
    MysqlTable.prototype.findAll = function (callback) {
        return this.find({}, callback);
    };
    /*   find2(criteria: any, callback?: (_results: any[]) => any): Promise<any[]> {
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
       }
   
           let def = Promise.defer();
   
           let colsToSearch = [];
           let tablesToSearch = [];
           let noDbProperties = [];
           let manySelectQuery = "";
           MysqlUtil.forEachKey(criteria, (objectKey) => {
   
               if (criteria.hasOwnProperty(objectKey)) {
                   let colName = MysqlUtil.toRowProperty(objectKey);
   
                   if (this.columns.indexOf(colName) !== -1 || this.primaryKey === colName) { // add to query- where clause
                       colsToSearch.push(colName + " = " + this.connection.escape(criteria[objectKey]));
                   } else { //if it's name is table's name,add to the tablesToSearch list for future use.
                       if (this.connection.table(colName) !== undefined) {
                           tablesToSearch.push(colName);
                       } else { //not a table or a column? then add it to no database properties, these properties are passing to the results after all other operations have done.
                           noDbProperties.push(objectKey);
                       }
                   }
               }
           });
   
           let whereParameterStr = "";
   
           if (colsToSearch.length > 0) {
               whereParameterStr = " WHERE " + colsToSearch.join(" AND ");
           }
   
           let _query = ("SELECT * FROM " + this.name + whereParameterStr);
   
           this.connection.query(_query, (err, results) => {
               if (err || !results) {
                   def.reject(err);
                   return;
               }
   
               //edw exoume to users list logika.
   
               results.forEach((result) => {
                   let _obj = {};
                   if (noDbProperties.length > 0) {
                       for (let i = 0; i < noDbProperties.length; i++) {
                           result[noDbProperties[i]] = criteria[noDbProperties[i]];
                       }
                   }
                   if (tablesToSearch.length > 0) {
                       let otherFindPromises = [];
                       tablesToSearch.forEach((_tableToSearch: string) => {
                           let subCriteriaObjectPropertyname = MysqlUtil.toObjectProperty(_tableToSearch);
                           let subCriteria = criteria[subCriteriaObjectPropertyname];
                           MysqlUtil.forEachKey(subCriteria, (subCriteriaKey) => {
                               let resultColumnRowName = MysqlUtil.toRowProperty(subCriteriaKey);
                               if (result.hasOwnProperty(resultColumnRowName)) {
                                   subCriteria[subCriteriaKey] = result[resultColumnRowName];
                               }
                           });
                           //ws edw exoume
                           let subTable = this.connection.table(_tableToSearch);
                           let subFindPromise = subTable.find2(subCriteria);
                           otherFindPromises.push(subFindPromise);
                           subFindPromise.then((_subResults) => {
                               result[subCriteriaObjectPropertyname] = _subResults;
   
                           });
                           //   console.dir(subCriteria);
                           //    console.log(" inside " + subTable.name);
   
                       });
   
                       Promise.all(otherFindPromises).then((allFindResults: any[]) => {
                           console.dir(result);
                           if (callback) {
                               callback(result);
                           }
   
                           def.resolve(result);
                       });
                   } else {
                       if (callback) {
                           callback(results);
                       }
   
                       def.resolve(results);
                   }
   
   
   
               });
   
   
           });
   
   
   
   
           return def.promise;
       }
      */
    MysqlTable.prototype.save = function (jsObject, callback) {
        var _this = this;
        //sta arguments borw na perniounte ta values me tin seira, ton properties pou exei to model-jsObject
        return new Promise(function (resolve, reject) {
            var primaryKeyValue = _this.getPrimaryKeyValue(jsObject);
            //14-08-2015 always run getRowAsArray before save.  if (this.columns.length === 0 || this.values.length === 0) {
            var arr = _this.getRowAsArray(jsObject);
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
    MysqlTable.prototype.safeRemove = function (criteria, callback) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var primaryKeyValue = _this.getPrimaryKeyValue(criteria);
            if (primaryKeyValue <= 0) {
                reject('Primary Key is missing!');
            }
            var _query = "DELETE FROM " + _this.name + " WHERE " + _this.primaryKey + " = " + primaryKeyValue;
            _this.connection.query(_query, function (err, result) {
                if (err) {
                    // console.dir(err);
                    reject(err);
                }
                var _objReturned = { affectedRows: result.affectedRows, table: _this.name };
                _this.connection.notice(_this.name, _query, [_objReturned]);
                resolve(_objReturned);
                if (callback) {
                    callback(_objReturned); //an kai kanonika auto to kanei mono t
                }
            });
        });
    };
    MysqlTable.prototype.remove = function (criteria, callback) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var primaryKeyValue = _this.getPrimaryKeyValue(criteria);
            if (!primaryKeyValue || primaryKeyValue <= 0) {
                var arr = _this.getRowAsArray(criteria);
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
                    var _objReturned = { affectedRows: result.affectedRows, table: _this.name };
                    _this.connection.notice(_this.name, _query, [_objReturned]);
                    resolve(_objReturned);
                    if (callback) {
                        callback(_objReturned); //an kai kanonika auto to kanei mono t
                    }
                });
            }
            else {
                // return this.safeRemove(jsObject);
                _this.safeRemove(criteria).then(function (_res) {
                    resolve(_res);
                });
            }
        });
    };
    return MysqlTable;
})();
exports.default = MysqlTable;
//# sourceMappingURL=MysqlTable.js.map