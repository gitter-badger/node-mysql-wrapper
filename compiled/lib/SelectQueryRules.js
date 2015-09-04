var MysqlUtil_1 = require("./MysqlUtil");
var SelectQueryRules = (function () {
    function SelectQueryRules() {
        this.orderByClause = "";
        this.groupByClause = "";
        this.limitClause = "";
    }
    SelectQueryRules.build = function (parentRule) {
        var _rules = new SelectQueryRules();
        if (parentRule) {
            _rules.from(parentRule);
        }
        return _rules;
    };
    SelectQueryRules.prototype.orderBy = function (columnKey, descending) {
        if (!columnKey || (columnKey !== undefined && columnKey === "")) {
            this.orderByClause = "";
        }
        else {
            this.orderByClause = " ORDER BY " + MysqlUtil_1.default.toRowProperty(columnKey) + (descending ? " DESC " : "");
        }
        return this;
    };
    SelectQueryRules.prototype.groupBy = function (columnKey) {
        if (!columnKey || (columnKey !== undefined && columnKey === "")) {
            this.groupByClause = "";
        }
        else {
            this.groupByClause = " GROUP BY " + columnKey;
        }
        return this;
    };
    SelectQueryRules.prototype.limit = function (limitRowsOrStart, limitEnd) {
        if (!limitRowsOrStart || (limitRowsOrStart !== undefined && limitRowsOrStart === 0)) {
            this.limitClause = "";
        }
        else {
            this.limitClause = " LIMIT " + limitRowsOrStart + (limitEnd !== undefined && limitEnd > limitRowsOrStart ? "," + limitEnd : "");
        }
        return this;
    };
    SelectQueryRules.prototype.clearOrderBy = function () {
        this.orderByClause = "";
        return this;
    };
    SelectQueryRules.prototype.clearGroupBy = function () {
        this.groupByClause = "";
        return this;
    };
    SelectQueryRules.prototype.clearLimit = function () {
        this.limitClause = "";
        return this;
    };
    SelectQueryRules.prototype.clear = function () {
        return this.clearOrderBy().clearGroupBy().clearLimit();
    };
    SelectQueryRules.prototype.from = function (parentRule) {
        if (this.orderByClause.length < 1) {
            this.orderByClause = parentRule.orderByClause;
        }
        if (this.groupByClause.length < 1) {
            this.groupByClause = parentRule.groupByClause;
        }
        if (this.limitClause.length < 1) {
            this.limitClause = parentRule.limitClause;
        }
        return this;
    };
    SelectQueryRules.prototype.toString = function () {
        var afterWhere = "";
        if (this.groupByClause.length > 1 && this.orderByClause.length > 1) {
            afterWhere = this.orderByClause;
        }
        else {
            afterWhere = this.orderByClause + this.groupByClause + this.limitClause;
        }
        return afterWhere;
    };
    return SelectQueryRules;
})();
exports.SelectQueryRules = SelectQueryRules;
