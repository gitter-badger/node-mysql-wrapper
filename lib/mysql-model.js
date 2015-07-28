function MySQLModel(jsObject, table) {

    this.jsObject = jsObject;
    this.columns = [];
    this.values = [];
    this.table = table;
    this[table.primaryKey] = '';

    this.toRow();
};


MySQLModel.prototype.toRow = function () {
    this.columns = [];
    this.values = [];

    if (this.jsObject.hasOwnProperty(this.table.primaryKey)) {
        this[this.table.primaryKey] = this.jsObject[this.table.primaryKey];
    }


    for (key in this.jsObject) {
        //convert modelKey to model_key
        var _col = key.replace(/([A-Z]+)/g, "_$1").replace(/^_/, "").toLowerCase();
        //only if this key/property of object is actualy a column (except  primary key)

        if (this.table.columns.indexOf(_col) !== -1) {

            this.columns.push(_col);
            this.values.push(this.jsObject[key]);
        }

    }


};


module.exports = MySQLModel;

