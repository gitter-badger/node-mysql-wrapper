var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var SelectQueryRules_1 = require("./SelectQueryRules");
var Promise = require('bluebird');
var SelectQuery = (function () {
    function SelectQuery(_table, _criteriaRawJsObject, _callback) {
        this._table = _table;
        this._criteriaRawJsObject = _criteriaRawJsObject;
        this._callback = _callback;
        this._rules = new SelectQueryRules_1.SelectQueryRules().from(this._table.rules);
    }
    SelectQuery.prototype.orderBy = function (columnKey, descending) {
        this._rules.orderBy(columnKey, descending);
        return this;
    };
    SelectQuery.prototype.groupBy = function (columnKey) {
        this._rules.groupBy(columnKey);
        return this;
    };
    SelectQuery.prototype.limit = function (limitStart, limitEnd) {
        this._rules.limit(limitStart, limitEnd);
        return this;
    };
    SelectQuery.prototype.from = function (parentRules) {
        this._rules.from(parentRules);
        return this;
    };
    SelectQuery.prototype.promise = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            //  if(!this._rules){
            if (_this._criteriaRawJsObject["tableRules"] !== undefined) {
                _this._rules = SelectQueryRules_1.SelectQueryRules.fromRawObject(_this._criteriaRawJsObject["tableRules"]);
            }
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
var SelectQueryWhere = (function (_super) {
    __extends(SelectQueryWhere, _super);
    function SelectQueryWhere(table, callback) {
        _super.call(this, table, {}, callback);
        this.parentObjects = new Map();
        this.currentTable = this._table.name;
    }
    SelectQueryWhere.prototype.where = function (_keyOrValue, _value) {
        var key = _keyOrValue, value = _value;
        if (value === undefined) {
            key = this._table.primaryKey;
            value = _keyOrValue;
        }
        if (this.currentTable === this._table.name) {
            this.criteriaObj[key] = value;
        }
        else {
            this.criteriaObj[this.currentTable][key] = value;
        }
        return this;
    };
    SelectQueryWhere.prototype.table = function (tableName) {
        tableName = tableName || this._table.name;
        if (this.currentTable !== this._table.name) {
        }
        if (this.currentTable !== this._table.name) {
            this.criteriaObj[this.currentTable] = {};
        }
        return this;
    };
    SelectQueryWhere.prototype.promise = function () {
        this._criteriaRawJsObject = this.criteriaObj;
        return _super.prototype.promise.call(this);
    };
    return SelectQueryWhere;
})(SelectQuery);
exports.SelectQueryWhere = SelectQueryWhere;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SelectQuery;
