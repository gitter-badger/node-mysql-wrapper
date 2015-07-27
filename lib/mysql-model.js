function MySQLModel(jsObject, tableName, connection) {
    this.connection = connection;
    this.jsObject = jsObject;
    this.columns = [];
    this.values = [];
    this.table = tableName;

    this.toRow();
};


MySQLModel.prototype.toRow = function () {
    this.columns = [];
    this.values = [];

    
    if (this.connection.tables.hasOwnProperty(this.table)) {
        var _tableDbFromStructure = this.connection.tables[this.table];

        for (key in this.jsObject) {
            //convert modelKey to model_key
            var _col = key.replace(/([A-Z]+)/g, "_$1").replace(/^_/, "").toLowerCase();
            //only if this key/property of object is actualy a column
            if (_tableDbFromStructure.indexOf(_col) !== -1) {

                this.columns.push(_col);
                this.values.push(this.jsObject[key]);
            }

        }
    }

};


global.MySQLModel = MySQLModel;

