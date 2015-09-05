var Helper_1 = require("./Helper");
var Criteria = (function () {
    function Criteria(rawCriteriaObject, tables, noDatabaseProperties, whereClause) {
        this.rawCriteriaObject = rawCriteriaObject;
        this.tables = tables;
        this.noDatabaseProperties = noDatabaseProperties;
        this.whereClause = whereClause;
    }
    return Criteria;
})();
exports.Criteria = Criteria;
var CriteriaBuilder = (function () {
    function CriteriaBuilder(table) {
        this._table = table;
    }
    CriteriaBuilder.prototype.build = function (rawCriteriaObject) {
        var _this = this;
        var colsToSearch = [];
        var tablesToSearch = [];
        var noDbProperties = [];
        var whereParameterStr = "";
        Helper_1.default.forEachKey(rawCriteriaObject, function (objectKey) {
            var colName = Helper_1.default.toRowProperty(objectKey);
            if (_this._table.columns.indexOf(colName) !== -1 || _this._table.primaryKey === colName) {
                colsToSearch.push(colName + " = " + _this._table.connection.escape(rawCriteriaObject[objectKey]));
            }
            else {
                if (_this._table.connection.table(colName) !== undefined) {
                    tablesToSearch.push(colName);
                }
                else {
                    noDbProperties.push(objectKey);
                }
            }
        });
        if (colsToSearch.length > 0) {
            whereParameterStr = " WHERE " + colsToSearch.join(" AND ");
        }
        return new Criteria(rawCriteriaObject, tablesToSearch, noDbProperties, whereParameterStr);
    };
    return CriteriaBuilder;
})();
exports.CriteriaBuilder = CriteriaBuilder;
