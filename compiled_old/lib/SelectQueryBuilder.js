var SelectQueryBuilder = (function () {
    function SelectQueryBuilder(table) {
        this.table = table;
        this.rawCriteria = {};
        this.childTables = new Map();
    }
    SelectQueryBuilder.prototype.where = function (key, value) {
        return this;
    };
    SelectQueryBuilder.prototype.orderBy = function (column, desceding) {
        if (desceding === void 0) { desceding = false; }
        return this;
    };
    SelectQueryBuilder.prototype.join = function (tableName) {
        return this;
    };
    SelectQueryBuilder.prototype.joinAs = function (tableName, butPropertyAccessName) {
        return this;
    };
    SelectQueryBuilder.prototype.at = function (tableName) {
        return new SelectQueryBuilder(this.table.connection.table(tableName));
    };
    SelectQueryBuilder.prototype.limit = function (start, end) {
        return this;
    };
    SelectQueryBuilder.prototype.build = function () {
        return this.rawCriteria;
    };
    return SelectQueryBuilder;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SelectQueryBuilder;
