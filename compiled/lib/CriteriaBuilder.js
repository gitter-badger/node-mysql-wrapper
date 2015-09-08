var Helper_1 = require("./Helper");
var CriteriaBuilder = (function () {
    function CriteriaBuilder(primaryTable, tablePropertyName, parentBuilder) {
        this.primaryTable = primaryTable;
        this.tablePropertyName = tablePropertyName;
        this.parentBuilder = parentBuilder;
        this.rawCriteria = {};
        if (parentBuilder !== undefined) {
            this.rawCriteria = parentBuilder.rawCriteria[tablePropertyName];
        }
    }
    CriteriaBuilder.prototype.where = function (key, value) {
        this.rawCriteria[key] = value;
        return this;
    };
    CriteriaBuilder.prototype.createRulesIfNotExists = function () {
        if (!Helper_1.default.hasRules(this.rawCriteria)) {
            this.rawCriteria["tableRules"] = {};
        }
    };
    CriteriaBuilder.prototype.orderBy = function (column, desceding) {
        if (desceding === void 0) { desceding = false; }
        this.createRulesIfNotExists();
        this.rawCriteria["tableRules"]["orderBy" + (desceding ? "Desc" : "")] = column;
        return this;
    };
    CriteriaBuilder.prototype.limit = function (start, end) {
        this.createRulesIfNotExists();
        if (end !== undefined && end > start) {
            this.rawCriteria["tableRules"]["limitStart"] = start;
            this.rawCriteria["tableRules"]["limitEnd"] = end;
        }
        else {
            this.rawCriteria["tableRules"]["limit"] = start;
        }
        return this;
    };
    CriteriaBuilder.prototype.join = function (realTableName, foreignColumnName) {
        var _joinedTable = {};
        _joinedTable[foreignColumnName] = "=";
        this.rawCriteria[realTableName] = _joinedTable;
        return this;
    };
    CriteriaBuilder.prototype.joinAs = function (tableNameProperty, realTableName, foreignColumnName) {
        //this.childTables.push(tableNameProperty,realTableName);
        //den ginete edw mexri na kanw kai to 'as' sta criteria mesa sto selectquery, to opoio 9a kanw twra.	this.rawCriteria[]
        //this.createRulesIfNotExists();
        var _joinedTable = {};
        _joinedTable[foreignColumnName] = "=";
        _joinedTable["tableRules"] = { table: realTableName };
        this.rawCriteria[tableNameProperty] = _joinedTable;
        return this;
    };
    CriteriaBuilder.prototype.at = function (tableNameProperty) {
        return new CriteriaBuilder(this.primaryTable, tableNameProperty, this);
    };
    CriteriaBuilder.prototype.parent = function () {
        this.parentBuilder.rawCriteria[this.tablePropertyName] = this.rawCriteria;
        return this.parentBuilder;
    };
    CriteriaBuilder.prototype.original = function () {
        if (this.parentBuilder !== undefined) {
            return this.parent().original();
        }
        else {
            return this;
        }
    };
    CriteriaBuilder.prototype.build = function () {
        if (this.parentBuilder !== undefined) {
            return this.parent().build();
        }
        else {
            return this.rawCriteria;
        }
    };
    return CriteriaBuilder;
})();
exports.default = CriteriaBuilder;
