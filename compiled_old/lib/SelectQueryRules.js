var Helper_1 = require("./Helper");
var SelectQueryRules = (function () {
    function SelectQueryRules() {
        this.manuallyEndClause = "";
        this.manuallyBeginClause = "";
        this.orderByColumn = "";
        this.orderByDescColumn = "";
        this.groupByColumn = "";
        this.limitStart = 0;
        this.limitEnd = 0;
    }
    SelectQueryRules.build = function (parentRule) {
        var _rules = new SelectQueryRules();
        if (parentRule) {
            _rules.from(parentRule);
        }
        return _rules;
    };
    SelectQueryRules.prototype.last = function (propertyClauseName) {
        this.lastPropertyClauseName = propertyClauseName;
    };
    SelectQueryRules.prototype.orderBy = function (columnKey, descending) {
        if (!columnKey || (columnKey !== undefined && columnKey === "")) {
            this.orderByColumn = "";
        }
        else {
            if (descending) {
                this.orderByDescColumn = columnKey;
                this.last("orderByDescColumn");
            }
            else {
                this.orderByColumn = columnKey;
                this.last("orderByColumn");
            }
        }
        return this;
    };
    SelectQueryRules.prototype.groupBy = function (columnKey) {
        if (!columnKey || (columnKey !== undefined && columnKey === "")) {
            this.groupByColumn = "";
        }
        else {
            this.groupByColumn = columnKey;
            this.last("groupByColumn");
        }
        return this;
    };
    SelectQueryRules.prototype.limit = function (limitRowsOrStart, limitEnd) {
        if (limitEnd === undefined && limitRowsOrStart === undefined) {
            this.limitStart = 0;
            this.limitEnd = 0;
        }
        else {
            if (limitEnd !== undefined && limitEnd > limitRowsOrStart) {
                this.limitStart = limitRowsOrStart;
                this.limitEnd = limitEnd;
            }
            else if (limitEnd === undefined) {
                this.limitStart = 0;
                this.limitEnd = limitRowsOrStart;
            }
            this.last("limitEnd");
        }
        return this;
    };
    SelectQueryRules.prototype.appendToBegin = function (manualAfterWhereString) {
        if (manualAfterWhereString !== undefined && manualAfterWhereString.length > 0) {
            this.manuallyBeginClause += manualAfterWhereString;
            this.last("manuallyBeginClause");
        }
        return this;
    };
    SelectQueryRules.prototype.appendToEnd = function (manualAfterWhereString) {
        if (manualAfterWhereString !== undefined && manualAfterWhereString.length > 0) {
            this.manuallyEndClause += manualAfterWhereString;
            this.last("manuallyEndClause");
        }
        return this;
    };
    SelectQueryRules.prototype.append = function (appendToCurrent) {
        if (appendToCurrent !== undefined && appendToCurrent.length > 0) {
            if (this.lastPropertyClauseName !== undefined && this.lastPropertyClauseName.length > 1) {
                this[this.lastPropertyClauseName] += appendToCurrent;
            }
            else {
                this.manuallyBeginClause = appendToCurrent;
            }
        }
        return this;
    };
    SelectQueryRules.prototype.clearOrderBy = function () {
        this.orderByColumn = "";
        this.orderByDescColumn = "";
        return this;
    };
    SelectQueryRules.prototype.clearGroupBy = function () {
        this.groupByColumn = "";
        return this;
    };
    SelectQueryRules.prototype.clearLimit = function () {
        this.limitStart = 0;
        this.limitEnd = 0;
        return this;
    };
    SelectQueryRules.prototype.clearEndClause = function () {
        this.manuallyEndClause = "";
        return this;
    };
    SelectQueryRules.prototype.clearBeginClause = function () {
        this.manuallyBeginClause = "";
        return this;
    };
    SelectQueryRules.prototype.clear = function () {
        this.last("");
        return this.clearBeginClause().clearOrderBy().clearGroupBy().clearLimit().clearEndClause();
    };
    SelectQueryRules.prototype.from = function (parentRule) {
        if (this.manuallyBeginClause.length < 1) {
            this.manuallyBeginClause = parentRule.manuallyBeginClause;
        }
        if (this.orderByColumn.length < 1) {
            this.orderByColumn = parentRule.orderByColumn;
        }
        if (this.orderByDescColumn.length < 1) {
            this.orderByDescColumn = parentRule.orderByDescColumn;
        }
        if (this.groupByColumn.length < 1) {
            this.groupByColumn = parentRule.groupByColumn;
        }
        if (this.limitStart === 0 || this.limitEnd === 0) {
            this.limitStart = parentRule.limitStart;
            this.limitEnd = parentRule.limitEnd;
        }
        if (this.manuallyEndClause.length < 1) {
            this.manuallyEndClause = parentRule.manuallyEndClause;
        }
        return this;
    };
    SelectQueryRules.prototype.isEmpty = function () {
        if (this.manuallyBeginClause.length < 1 && this.orderByColumn.length < 1 && this.orderByDescColumn.length < 1 && this.groupByColumn.length < 1
            && this.limitStart === 0 && this.limitEnd === 0 && this.manuallyEndClause.length < 1) {
            return true;
        }
        else {
            return false;
        }
    };
    SelectQueryRules.prototype.toString = function () {
        return SelectQueryRules.toString(this);
    };
    SelectQueryRules.prototype.toRawObject = function () {
        return SelectQueryRules.toRawObject(this);
    };
    SelectQueryRules.toString = function (rules) {
        var afterWhere = "";
        var _orderbyClause = "";
        var _groupByClause = rules.groupByColumn.length > 1 ? " GROUP BY " + Helper_1.default.toRowProperty(rules.groupByColumn) + " " : "";
        var _limitClause = rules.limitEnd > 0 ? " LIMIT " + rules.limitStart + ", " + rules.limitEnd : "";
        if (rules.orderByColumn.length > 1) {
            _orderbyClause = " ORDER BY " + Helper_1.default.toRowProperty(rules.orderByColumn) + " ";
        }
        else if (rules.orderByDescColumn.length > 1) {
            _orderbyClause = " ORDER BY " + Helper_1.default.toRowProperty(rules.orderByDescColumn) + " DESC ";
        }
        if (rules.groupByColumn.length > 1 && (rules.orderByColumn.length > 1 || rules.orderByDescColumn.length > 1)) {
            afterWhere = _orderbyClause;
            _groupByClause = "";
        }
        else {
            afterWhere = _orderbyClause + _groupByClause + _limitClause;
        }
        return rules.manuallyBeginClause + afterWhere + rules.manuallyEndClause;
    };
    SelectQueryRules.toRawObject = function (rules) {
        if (rules.isEmpty()) {
            return undefined;
        }
        var obj;
        if (rules.manuallyBeginClause.length > 1) {
            obj.begin = rules.manuallyBeginClause;
        }
        if (rules.manuallyEndClause.length > 1) {
            obj.end = rules.manuallyEndClause;
        }
        if (rules.orderByColumn.length > 1) {
            obj.orderBy = rules.orderByColumn;
        }
        if (rules.orderByDescColumn.length > 1) {
            obj.orderByDesc = rules.orderByDescColumn;
        }
        if (rules.groupByColumn.length > 1) {
            obj.groupBy = rules.groupByColumn;
        }
        if (rules.limitEnd > 0) {
            obj.limitStart = rules.limitStart;
            obj.limitEnd = rules.limitEnd;
        }
        return obj;
    };
    SelectQueryRules.fromRawObject = function (obj) {
        var rules = new SelectQueryRules();
        rules.appendToBegin(obj.begin);
        if (obj.orderBy !== undefined && obj.orderBy.length > 1) {
            rules.orderBy(obj.orderBy, false);
        }
        else if (obj.orderByDesc !== undefined && obj.orderByDesc.length > 1) {
            rules.orderBy(obj.orderByDesc, true);
        }
        if (obj.limit > 0) {
            if (obj.limitEnd > 0) {
                obj.limitStart = obj.limit;
            }
            else {
                obj.limitStart = 0;
                obj.limitEnd = obj.limit;
            }
        }
        rules.limit(obj.limitStart, obj.limitEnd);
        rules.groupBy(obj.groupBy);
        rules.appendToEnd(obj.end);
        return rules;
    };
    return SelectQueryRules;
})();
exports.SelectQueryRules = SelectQueryRules;
