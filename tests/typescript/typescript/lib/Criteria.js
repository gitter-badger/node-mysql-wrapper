var Criteria = (function () {
    function Criteria(rawCriteriaObject, tables, noDatabaseProperties, whereClause) {
        this.rawCriteriaObject = rawCriteriaObject;
        this.tables = tables;
        this.noDatabaseProperties = noDatabaseProperties;
        this.whereClause = whereClause;
    }
    return Criteria;
})();
exports.default = Criteria;
//# sourceMappingURL=Criteria.js.map