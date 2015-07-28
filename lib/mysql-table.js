var MySQLModel = require('./mysql-model');
function MySQLTable(tableName) {
    this.columns = [];
    this.primaryKey;
    this.name = tableName;
 
};

//27:07:2015 9a ta kanw me mysql auta, na min xreiazete to json file 

MySQLTable.prototype.setColumns = function (_columns) {
    this.columns = _columns;

};

MySQLTable.prototype.setPrimaryKey = function (primaryKeyColumnName) {
    this.primaryKey = primaryKeyColumnName;
};

MySQLTable.prototype.createModel = function (jsObject) {

    return new MySQLModel(jsObject, this);
};

MySQLTable.prototype.toString = function () {
    return this.name;
};

module.exports = MySQLTable;

