var Helper_1 = require("./Helper");
var SelectQueryBuilder = (function () {
    function SelectQueryBuilder(primaryTable, tablePropertyName, parentBuilder) {
        this.primaryTable = primaryTable;
        this.tablePropertyName = tablePropertyName;
        this.parentBuilder = parentBuilder;
        this.rawCriteria = {};
        if (parentBuilder !== undefined) {
            this.rawCriteria = parentBuilder.rawCriteria[tablePropertyName];
        }
    }
    SelectQueryBuilder.prototype.where = function (key, value) {
        this.rawCriteria[key] = value;
        return this;
    };
    SelectQueryBuilder.prototype.createRulesIfNotExists = function () {
        if (!Helper_1.default.hasRules(this.rawCriteria)) {
            this.rawCriteria["tableRules"] = {};
        }
    };
    SelectQueryBuilder.prototype.orderBy = function (column, desceding) {
        if (desceding === void 0) { desceding = false; }
        this.createRulesIfNotExists();
        this.rawCriteria["tableRules"]["orderBy" + (desceding ? "Desc" : "")] = column;
        return this;
    };
    SelectQueryBuilder.prototype.limit = function (start, end) {
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
    SelectQueryBuilder.prototype.join = function (realTableName, foreignColumnName) {
        var _joinedTable = {};
        _joinedTable[foreignColumnName] = "=";
        this.rawCriteria[realTableName] = _joinedTable;
        return this;
    };
    SelectQueryBuilder.prototype.joinAs = function (tableNameProperty, realTableName, foreignColumnName) {
        //this.childTables.push(tableNameProperty,realTableName);
        //den ginete edw mexri na kanw kai to 'as' sta criteria mesa sto selectquery, to opoio 9a kanw twra.	this.rawCriteria[]
        //this.createRulesIfNotExists();
        var _joinedTable = {};
        _joinedTable[foreignColumnName] = "=";
        _joinedTable["tableRules"] = { table: realTableName };
        this.rawCriteria[tableNameProperty] = _joinedTable;
        return this;
    };
    SelectQueryBuilder.prototype.at = function (tableNameProperty) {
        return new SelectQueryBuilder(this.primaryTable, tableNameProperty, this);
    };
    SelectQueryBuilder.prototype.parent = function () {
        this.parentBuilder.rawCriteria[this.tablePropertyName] = this.rawCriteria;
        return this.parentBuilder;
    };
    SelectQueryBuilder.prototype.first = function () {
        if (this.parentBuilder !== undefined) {
            return this.parent().first();
        }
        else {
            return this;
        }
    };
    SelectQueryBuilder.prototype.build = function () {
        if (this.parentBuilder !== undefined) {
            return this.parent().build();
        }
        else {
            return this.rawCriteria;
        }
    };
    return SelectQueryBuilder;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SelectQueryBuilder;
