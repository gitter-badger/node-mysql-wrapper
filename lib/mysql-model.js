var deferred = require('deferred');
function MySQLModel(jsObject, table) {

    this.jsObject = jsObject;
    this.values = [];
    this.columns = []; //Here we have the columns THAT EXISTS for this jsObject.
    this.table = table;
    var primaryKeyObjectProperty = this.toObjectProperty(this.table.primaryKey);
    if (this.jsObject.hasOwnProperty(primaryKeyObjectProperty)) {
        this[this.table.primaryKey] = this.jsObject[primaryKeyObjectProperty];
    } else {
        this[this.table.primaryKey] = 0;
    }
    //only when nessecary this.toRow();

};

MySQLModel.prototype.toObjectProperty = function (columnKey) {
    //convert column_key to objectKey
    return columnKey.replace(/(_.)/g, function (x) { return x[1].toUpperCase() });
};

MySQLModel.prototype.toRowProperty = function (objectKey) {
    //convert objectKey to column_key
    return objectKey.replace(/([A-Z]+)/g, "_$1").replace(/^_/, "").toLowerCase();
}


MySQLModel.prototype.toRow = function () {
    this.columns = [];
    this.values = [];

    for (key in this.jsObject) {
        var _col = this.toRowProperty(key);
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

    if (this.columns.length === 0 || this.values.length === 0) {
        this.toRow();
    }

    if (primaryKeyValue > 0) {
        //update
        var colummnsAndValuesStr = "";
        for (var i = 0; i < this.columns.length; i++) {
            colummnsAndValuesStr += "," + this.columns[i] + "=" + this.table.connection.escape(this.values[i]);
        }
        colummnsAndValuesStr = colummnsAndValuesStr.substring(1);
        this.table.connection.query("UPDATE " + this.table.name + " SET " + colummnsAndValuesStr + " WHERE " + this.table.primaryKey + " =  " + primaryKeyValue, function (err, result) {
            if (err) {
                console.dir(err);
                def.reject(err);

            }
            def.resolve(self.jsObject);
        });

    } else {
        //create
        this.table.connection.query("INSERT INTO ?? (??) VALUES(?) ", [this.table.name, this.columns, this.values], function (err, result) {
            if (err) { console.dir(err); def.reject(err); }
            self[self.table.primaryKey] = result.insertId;

            var primaryKeyJsObjectProperty = self.toObjectProperty(self.table.primaryKey);
            self.jsObject[primaryKeyJsObjectProperty] = result.insertId;
            def.resolve(self.jsObject);

        });
    }
    return def.promise;
};

MySQLModel.prototype.delete = function () {
    var def = deferred();
    var primaryKeyValue = this[this.table.primaryKey];
    if (primaryKeyValue <= 0) {
        def.reject('Primary Key is missing!');

    }
    var self = this;
    var _query = "DELETE FROM " + this.table.name + " WHERE " + this.table.primaryKey + " = " + primaryKeyValue;
    this.table.connection.query(_query, function (err, result) {
        if (err) {
            console.dir(err);
            def.reject(err);
        }

        def.resolve(self.jsObject);
    });

    return def.promise;
};

MySQLModel.prototype.find = function () {
    var def = deferred();
    var self = this;
    /* not only for primary keys   var primaryKeyValue = this[this.table.primaryKey];
      if (primaryKeyValue <= 0) {
          def.reject('Primary Key is missing!');
  
      }*/

    var colsToSearch = [];
    var tablesToSearch = [];
    var manySelectQuery = "";
    for (var objectKey in this.jsObject) {
        var colName = this.toRowProperty(objectKey);

        if (self.table.columns.indexOf(colName) !== -1 || self.table.primaryKey === colName) {

            colsToSearch.push(colName + " = " + self.table.connection.escape(self.jsObject[objectKey]));


        } else {


            //if not a column of this table, maybe it is other table's column/object property example jsObject={userId:3,comments{userId:3}}; find user with user_id =3 and all comments of this user where user_id=3.
            if (self.table.connection.table(self.toRowProperty(colName)) !== undefined) {
                //here to check if this is a really table
                tablesToSearch.push(colName);
            }

        }


    }

    if (tablesToSearch.length > 0) {
        [].forEach.call(tablesToSearch, function (_tableObjName) {
            var _table = self.toRowProperty(_tableObjName);

            var colsToSearchInOtherTable = [];

            for (otherObjectKey in self.jsObject[_tableObjName]) {

                var _otherObjVal = self.jsObject[_tableObjName][otherObjectKey];

                colsToSearchInOtherTable.push(self.toRowProperty(otherObjectKey) + " = " + self.table.connection.escape(_otherObjVal));
            }

            manySelectQuery = "SELECT * FROM " + _table + (colsToSearchInOtherTable.length > 0 ? " WHERE " + colsToSearchInOtherTable.join(" AND ") : "");

            //search now the other table and pass results in the property.

            self.table.connection.query(manySelectQuery, function (_err, _results) {
                if (_err) {
                    console.dir(_err);
                    return;
                }

                if (!_err) {
                    //[greek]elenxw an to _results einai length =1 ,an nai tote exoume ena pros ena, 9a diagrafw to px userInfos {userId :18} property, kai 9a  pernw to user_infos (me to 's') kai 9a vazw sto userInfo(xwris to's') to value me to row se object p vrike.
                    if (_results.length === 1) {

                        var otherTableObject = {};
                        for (otherColKey in _results[0]) {
                            otherTableObject[self.toObjectProperty(otherColKey)] = _results[0][otherColKey];
                        }
                        if (_tableObjName.slice(-1) === 's') {
                            /*Delete is the only true way to remove object's properties without any leftovers, but it works ~ 100 times slower, compared to it's "alternative", setting object[key] = undefined.*/
                            self.jsObject[self.toObjectProperty(_tableObjName)] = undefined;

                            _tableObjName = self.toObjectProperty(_tableObjName).slice(0, -1);

                        }

                        self.jsObject[_tableObjName] = otherTableObject;
                    } else {
                        self.jsObject[_tableObjName] = [];
                        for (var j = 0; j < _results.length; j++) {
                            var otherTableObject = {};
                            for (otherColkey in _results[j]) {
                                otherTableObject[self.toObjectProperty(otherColkey)] = _results[j][otherColkey];
                            }

                            self.jsObject[_tableObjName].push(otherTableObject);

                        }
                    }




                }
            });


        });

    }

    var _query = "SELECT * FROM " + this.table.name + " WHERE " + colsToSearch.join(" AND ");

    delete colsToSearch;

    this.table.connection.query(_query, function (err, results) {
        if (err) {
            console.dir(err);
            def.reject(err);
        } else if (results.length === 0) {

            def.resolve(); //undefined on callback
        }
        if (results.length > 1) {
            //TODO: EDW 9A EXW 9EMA DN BORW NA PARW TA MANY?
            //find many usualy any other properties passed to jsObject
            var jsObjectsList = [];
            for (var i = 0; i < results.length; i++) {
                var result = results[i];
                var jsObj = {};
                for (key in result) {
                    var propertyObjectKey = self.toObjectProperty(key);
                    jsObj[propertyObjectKey] = result[key];
                }
                jsObjectsList.push(jsObj);

            }
            def.resolve(jsObjectsList); //returns only the jsObject, no it's model object, if I want to use as modal I can call table.model(obj) on the callback
        } else {
            //find one ( usualy from id)
            var result = results[0];
            for (var key in result) {

                var propertyObjectKey = self.toObjectProperty(key);
                self.jsObject[propertyObjectKey] = result[key];

            }

            def.resolve([self.jsObject]); //return this as a list just like before.
        }

    });

    return def.promise;
};


module.exports = MySQLModel;

