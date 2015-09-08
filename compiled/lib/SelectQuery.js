var Helper_1 = require("./Helper");
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
                        obj[tablePropertyName] = [];
                        childResults.forEach(function (childResult) {
                            obj[tablePropertyName].push(_this._table.objectFromRow(childResult));
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
    SelectQuery.prototype.promise = function (rawCriteria, callback) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            //  if(!this._rules){
            var queryRules;
            if (rawCriteria["tableRules"] !== undefined) {
                queryRules = SelectQueryRules_1.SelectQueryRules.fromRawObject(rawCriteria["tableRules"]);
            }
            else {
                queryRules = _this._table.rules;
            }
            var criteria = _this._table.criteriaDivider.divide(rawCriteria);
            var query = "SELECT * FROM " + _this._table.name + criteria.whereClause + queryRules.toString();
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
    SelectQuery.prototype.execute = function (rawCriteria) {
        return this.promise(rawCriteria);
    };
    return SelectQuery;
})();
exports.default = SelectQuery;
