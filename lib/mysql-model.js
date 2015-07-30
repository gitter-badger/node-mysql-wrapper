var deferred = require('deferred');
function MySQLModel(jsObject, table) {

    this.jsObject = jsObject;
    this.columns = [];
    this.values = [];
    this.table = table;
    this[table.primaryKey] = jsObject[table.primaryKey] || 0 ;
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
MySQLModel.prototype.toObjectProperty = function (columnKey) {
    //convert column_key to objectKey
    return columnKey.replace(/(_.)/g, function (x) { return x[1].toUpperCase() });
};


MySQLModel.prototype.save = function () {
    var def = deferred();
    var self = this;
    var primaryKeyValue = this[this.table.primaryKey];
    
    if (primaryKeyValue) {
        console.log('update');
        def.resolve();
        //update
    } else {
        //create
        console.log('create');
        this.table.connection.query("INSERT INTO ?? (??) VALUES(?) ",[this.table.name,this.columns,this.values], function (err, result) {
            if (err) { console.dir(err); return; }
            self[self.table.primaryKey] = result.insertId;
           
            var testjsobjectId = self.toObjectProperty(self.table.primaryKey);
            self.jsObject[testjsobjectId] = result.insertId;
            def.resolve(self.jsObject);
            
        });
    }
    return def.promise;
};

module.exports = MySQLModel;

