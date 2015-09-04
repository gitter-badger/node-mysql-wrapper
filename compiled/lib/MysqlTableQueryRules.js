var MysqlUtil_1 = require("./MysqlUtil");
var MysqlTableQueryRules = (function () {
    function MysqlTableQueryRules() {
        this.orderByClause = "";
        this.groupByClause = "";
        this.limitClause = "";
    }
    MysqlTableQueryRules.prototype.orderBy = function (columnKey, descending) {
        this.orderByClause = " ORDER BY " + MysqlUtil_1.default.toRowProperty(columnKey) + (descending ? " DESC " : "");
    };
    MysqlTableQueryRules.prototype.groupBy = function (columnKey) {
        this.groupByClause = " GROUP BY " + columnKey;
    };
    MysqlTableQueryRules.prototype.limit = function (limitRowsOrStart, limitEnd) {
        this.limitClause = " LIMIT " + limitRowsOrStart + (limitEnd !== undefined && limitEnd > limitRowsOrStart ? "," + limitEnd : "");
    };
    MysqlTableQueryRules.prototype.toString = function () {
        var afterWhere = "";
        if (this.groupByClause.length > 1 && this.orderByClause.length > 1) {
            afterWhere = this.orderByClause;
        }
        else {
            afterWhere = this.orderByClause + this.groupByClause + this.limitClause;
        }
        return afterWhere;
    };
    return MysqlTableQueryRules;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MysqlTableQueryRules;
