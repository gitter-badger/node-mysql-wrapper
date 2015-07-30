var deferred = require('deferred');
function MySQLModel(jsObject, table) {

    this.jsObject = jsObject;
    this.values = [];
    this.columns = []; //Here we have the columns THAT EXISTS for this jsObject.
    this.table = table;
    this[table.primaryKey] = jsObject[table.primaryKey] || 0 ;
    this.toRow();
};

MySQLModel.prototype.toObjectProperty = function (columnKey) {
    //convert column_key to objectKey
    return columnKey.replace(/(_.)/g, function (x) { return x[1].toUpperCase() });
};


MySQLModel.prototype.toRow = function () {
    this.columns = [];
    this.values = [];

   
    var primaryKeyObjectProperty = this.toObjectProperty(this.table.primaryKey);
    if (this.jsObject.hasOwnProperty(primaryKeyObjectProperty)) {
        this[this.table.primaryKey] = this.jsObject[primaryKeyObjectProperty];
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
    
   
    /* this is an another way to do it 
    this.values = [];
    this.columns = [];
    for (var i = 0; i < this.table.columns.length; i++) {
        var col = this.table.columns[i];
        var objPropertyFromColumn = this.toObjectProperty(col);
        if(this.jsObject.hasOwnProperty(objPropertyFromColumn)){
            this.values.push(this.jsObject[objPropertyFromColumn]);
            this.columns.push(col);
        }
    }*/


};


MySQLModel.prototype.save = function () {
    var def = deferred();
    var self = this;
    var primaryKeyValue = this[this.table.primaryKey];
   
    if (primaryKeyValue>0) {
        //update
        var colummnsAndValuesStr="";
        for (var i = 0; i < this.columns.length; i++) {
            console.log(this.columns[i]);
            colummnsAndValuesStr += ","+this.columns[i] + "=" +this.table.connection.escape(this.values[i]);
        }
        colummnsAndValuesStr = colummnsAndValuesStr.substring(1);
        this.table.connection.query("UPDATE "+this.table.name+" SET "+colummnsAndValuesStr+" WHERE " + this.table.primaryKey + " =  " + primaryKeyValue, function (err, result) {
            if (err) {
                console.dir(err);
                def.reject(err);
                return;
            }
            def.resolve(self.jsObject);
        });

  
        
    } else {
        //create
        this.table.connection.query("INSERT INTO ?? (??) VALUES(?) ",[this.table.name,this.columns,this.values], function (err, result) {
            if (err) { console.dir(err); def.reject(err); return; }
            self[self.table.primaryKey] = result.insertId;
           
            var primaryKeyJsObjectProperty = self.toObjectProperty(self.table.primaryKey);
            self.jsObject[primaryKeyJsObjectProperty] = result.insertId;
            def.resolve(self.jsObject);
            
        });
    }
    return def.promise;
};

module.exports = MySQLModel;

