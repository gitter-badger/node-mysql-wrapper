var Helper_1 = require("../Helper");
var SelectQueryRules_1 = require("./SelectQueryRules");
var Promise = require('bluebird');
exports.EQUAL_TO_PROPERTY_SYMBOL = '=';
var SelectQuery = (function () {
    function SelectQuery(_table) {
        this._table = _table;
    }
    SelectQuery.prototype.parseQueryResult = function (result, criteria) {
        var _this = this;
        return new Promise(function (resolve) {
            var obj = _this._table.objectFromRow(result);
            if (criteria.tables.length > 0) {
                var tableFindPromiseList = [];
                criteria.tables.forEach(function (_tableProperty) {
                    var table = _this._table.connection.table(_tableProperty.tableName);
                    var tablePropertyName = Helper_1.default.toObjectProperty(_tableProperty.propertyName);
                    var criteriaJsObject = Helper_1.default.copyObject(criteria.rawCriteriaObject[tablePropertyName]);
                    Helper_1.default.forEachKey(criteriaJsObject, function (propertyName) {
                        if (criteriaJsObject[propertyName] === exports.EQUAL_TO_PROPERTY_SYMBOL) {
                            criteriaJsObject[propertyName] = result[Helper_1.default.toRowProperty(propertyName)];
                        }
                    });
                    var tableFindPromise = table.find(criteriaJsObject);
                    tableFindPromise.then(function (childResults) {
                        if (childResults.length === 1 &&
                            Helper_1.default.hasRules(criteriaJsObject) &&
                            (criteriaJsObject[SelectQueryRules_1.TABLE_RULES_PROPERTY].limit !== undefined && criteriaJsObject[SelectQueryRules_1.TABLE_RULES_PROPERTY].limit === 1) ||
                            (criteriaJsObject[SelectQueryRules_1.TABLE_RULES_PROPERTY].limitEnd !== undefined && criteriaJsObject[SelectQueryRules_1.TABLE_RULES_PROPERTY].limitEnd === 1)) {
                            obj[tablePropertyName] = _this._table.objectFromRow(childResults[0]);
                        }
                        else {
                            obj[tablePropertyName] = [];
                            childResults.forEach(function (childResult) {
                                obj[tablePropertyName].push(_this._table.objectFromRow(childResult));
                            });
                        }
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
    SelectQuery.prototype.promise = function (rawCriteria, callback) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            //  if(!this._rules){
            var queryRules;
            if (Helper_1.default.hasRules(rawCriteria)) {
                queryRules = SelectQueryRules_1.SelectQueryRules.fromRawObject(rawCriteria[SelectQueryRules_1.TABLE_RULES_PROPERTY]);
            }
            else {
                queryRules = new SelectQueryRules_1.SelectQueryRules().from(_this._table.rules);
            }
            var criteria = _this._table.criteriaDivider.divide(rawCriteria);
            var columnsToSelectString = "*";
            if (queryRules.exceptColumns.length > 0) {
                var columnsToSelect = _this._table.columns;
                queryRules.exceptColumns.forEach(function (col) {
                    var exceptColumn = Helper_1.default.toRowProperty(col);
                    var _colIndex;
                    if ((_colIndex = columnsToSelect.indexOf(exceptColumn)) !== -1) {
                        columnsToSelect.splice(_colIndex, 1);
                    }
                });
                if (columnsToSelect.length === 1) {
                    columnsToSelectString = columnsToSelect[0];
                }
                else {
                    columnsToSelectString = columnsToSelect.join(", ");
                }
                columnsToSelectString = _this._table.primaryKey + ", " + columnsToSelectString;
            }
            var query = "SELECT " + columnsToSelectString + " FROM " + _this._table.name + criteria.whereClause + queryRules.toString();
            _this._table.connection.query(query, function (error, results) {
                if (error || !results) {
                    reject(error + ' Error. On find');
                }
                var parseQueryResultsPromises = [];
                results.forEach(function (result) {
                    parseQueryResultsPromises.push(_this.parseQueryResult(result, criteria));
                });
                Promise.all(parseQueryResultsPromises).then(function (_objects) {
                    if (callback !== undefined) {
                        callback(_objects);
                    }
                    resolve(_objects);
                });
            });
        });
    };
    SelectQuery.prototype.execute = function (rawCriteria, callback) {
        return this.promise(rawCriteria);
    };
    return SelectQuery;
})();
exports.default = SelectQuery;
