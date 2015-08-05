var MySQLModel = require('./mysql-model');
function MySQLTable(tableName, _mysqlConObject) {
    if (!_mysqlConObject) {
        _mysqlConObject = require('./mysql-connection.js').DefaultConnection;
        var _thisTableFromCon = _mysqlConObject.table(tableName);
        this.columns = _thisTableFromCon.columns;
        this.primaryKey = _thisTableFromCon.primaryKey;
    } else {
        
        this.columns = [];
        this.primaryKey;
      
    }
    this.name = tableName;
    this.connection = _mysqlConObject; //I will need this on mysql-model
 
};

//27:07:2015 9a ta kanw me mysql auta, na min xreiazete to json file 

MySQLTable.prototype.setColumns = function (_columns) {
    this.columns = _columns;

};

MySQLTable.prototype.setPrimaryKey = function (primaryKeyColumnName) {
    this.primaryKey = primaryKeyColumnName;
};


MySQLTable.prototype.toString = function () {
    return this.name;
};

MySQLTable.prototype.model = function (jsObject) {
    return new MySQLModel(this, jsObject);
};


module.exports = MySQLTable;

