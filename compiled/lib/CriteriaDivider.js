var Helper_1 = require("./Helper");
var SelectQueryRules_1 = require("./queries/SelectQueryRules");
var CriteriaParts = (function () {
    function CriteriaParts(rawCriteriaObject, tables, noDatabaseProperties, whereClause) {
        this.rawCriteriaObject = rawCriteriaObject;
        this.tables = tables;
        this.noDatabaseProperties = noDatabaseProperties;
        this.whereClause = whereClause;
    }
    return CriteriaParts;
})();
exports.CriteriaParts = CriteriaParts;
var CriteriaDivider = (function () {
    function CriteriaDivider(table) {
        this._table = table;
    }
    CriteriaDivider.prototype.divide = function (rawCriteriaObject) {
        var _this = this;
        var colsToSearch = [];
        var tablesToSearch = [];
        var noDbProperties = [];
        var whereParameterStr = "";
        Helper_1.default.forEachKey(rawCriteriaObject, function (objectKey) {
            var colName = Helper_1.default.toRowProperty(objectKey);
            var exceptColumns = [];
            if (objectKey === SelectQueryRules_1.TABLE_RULES_PROPERTY && rawCriteriaObject[objectKey]["except"] !== undefined) {
                exceptColumns = rawCriteriaObject[objectKey]["except"];
            }
            if ((_this._table.columns.indexOf(colName) !== -1 && exceptColumns.indexOf(colName) !== -1) || _this._table.primaryKey === colName) {
                colsToSearch.push(colName + " = " + _this._table.connection.escape(rawCriteriaObject[objectKey]));
            }
            else {
                if (_this._table.connection.table(colName) !== undefined) {
                    tablesToSearch.push({ tableName: colName, propertyName: colName });
                }
                else {
                    noDbProperties.push(objectKey);
                }
            }
        });
        noDbProperties.forEach(function (key) {
            var prop = rawCriteriaObject[key];
            if (Helper_1.default.hasRules(prop)) {
                var realTableName = prop[SelectQueryRules_1.TABLE_RULES_PROPERTY]["table"];
                if (realTableName !== undefined) {
                    tablesToSearch.push({ tableName: Helper_1.default.toRowProperty(realTableName), propertyName: key });
                }
            }
        });
        if (colsToSearch.length > 0) {
            whereParameterStr = " WHERE " + colsToSearch.join(" AND ");
        }
        return new CriteriaParts(rawCriteriaObject, tablesToSearch, noDbProperties, whereParameterStr);
    };
    return CriteriaDivider;
})();
exports.CriteriaDivider = CriteriaDivider;
