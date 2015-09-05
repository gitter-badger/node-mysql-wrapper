var SelectQueryRules_1 = require("./SelectQueryRules");
var Promise = require('bluebird');
var SelectQuery = (function () {
    function SelectQuery(table, criteriaRawJsObject, callback) {
        this._table = table;
        this._criteriaRawJsObject = criteriaRawJsObject;
        this._rules = new SelectQueryRules_1.SelectQueryRules().from(this._table.rules);
        this._callback = callback;
    }
    SelectQuery.prototype.orderBy = function (columnKey, descending) {
        this._rules.orderBy(columnKey, descending);
        return this;
    };
    SelectQuery.prototype.groupBy = function (columnKey) {
        this._rules.groupBy(columnKey);
        return this;
    };
    SelectQuery.prototype.limit = function (limitRowsOrStart, limitEnd) {
        this._rules.limit(limitRowsOrStart, limitEnd);
        return this;
    };
    SelectQuery.prototype.promise = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var criteria = _this._table.criteriaBuilder.build(_this._criteriaRawJsObject);
            var queryRules = _this._rules.toString();
            var query = "SELECT * FROM " + _this._table.name + criteria.whereClause + queryRules;
            _this._table.connection.query(query, function (error, results) {
                if (error || !results) {
                    reject(error + ' Error. On find');
                }
                var parseQueryResultsPromises = [];
                results.forEach(function (result) {
                    parseQueryResultsPromises.push(_this._table.parseQueryResult(result, criteria));
                });
                Promise.all(parseQueryResultsPromises).then(function (_objects) {
                    if (_this._callback !== undefined) {
                        _this._callback(_objects);
                    }
                    resolve(_objects);
                });
            });
        });
    };
    SelectQuery.prototype.execute = function () {
        return this.promise();
    };
    SelectQuery.prototype.then = function (onFulfill, onReject, onProgress) {
        return this.promise().then(onFulfill, onReject, onProgress);
    };
    return SelectQuery;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SelectQuery;
