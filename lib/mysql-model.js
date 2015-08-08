var Promise = require('bluebird');
var EQUAL_TO_PROPERTY_SYMBOL = '=';

function MySQLModel(table, jsObject) {
    
    this.jsObject = jsObject;
    this.values = [];
    this.columns = []; //Here we have the columns THAT EXISTS for this jsObject.
    
    
    //check if table === string (table name) or it an object
    if (typeof table === 'string' || table instanceof String) {
        this.table = require('././mysql-connection.js').DefaultConnection.table(table);
    } else {
        this.table = table;
    }
    
    this.connection = this.table.connection;
    
    var primaryKeyObjectProperty = this.toObjectProperty(this.table.primaryKey);
    if (this.jsObject) {
        
        
        if (this.jsObject.constructor === Array) {

        } else {
            if (this.jsObject.hasOwnProperty(primaryKeyObjectProperty)) {
                this[this.table.primaryKey] = this.jsObject[primaryKeyObjectProperty];
             
            } else {
                this[this.table.primaryKey] = 0;
            }
            this.primaryKeyValue = this[this.table.primaryKey]//If we want the value but we dont know the of primary key's column's name.
        }
    }


    //only when nessecary this.toRow();

};

//global call: MySQLModel.extend(functionName,function);
MySQLModel.extend = function () { //these are shared custom functions for all models.
    var args = Array.prototype.slice.call(arguments);

    if (args.length > 1) {
        var nameOfFunction = args[0];
        var _theFunction = args[1];
        
        var isFunction = !!(_theFunction && _theFunction.constructor && _theFunction.call && _theFunction.apply);
        if (isFunction) {
            MySQLModel.prototype[nameOfFunction] = _theFunction;
        }
    }

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

MySQLModel.prototype.get = function () {
    return this.jsObject.length === 1 ? this.jsObject[0] : this.jsObject;
};

MySQLModel.prototype.parseTable = function (mysqlTableToSearch, parentObject) {
    var newdef = Promise.defer();
    
    var tableProperty = this.toObjectProperty(mysqlTableToSearch); //comments
    
    var tableObj = parentObject[tableProperty];
    
    for (var key in tableObj) {
        var _val = tableObj[key];
        if (_val === EQUAL_TO_PROPERTY_SYMBOL) {
            tableObj[key] = parentObject[key];
        }

    }
    
    var _model = this.table.connection.table(mysqlTableToSearch).model(tableObj);
    
    _model.find(parentObject).then(function (results) {
        
        parentObject[tableProperty] = results;
        newdef.resolve();

    });
    
    
    return newdef.promise;
};

MySQLModel.prototype.parseResult = function (result, tablesToSearch) {
    var def = Promise.defer();
    var _obj = {};
    
    var self = this;
    for (key in result) {
        var propertyObjectKey = this.toObjectProperty(key);
        _obj[propertyObjectKey] = result[key];
    }
    
    
    if (tablesToSearch.length === 0) {
        def.resolve(_obj);
    } else {
        var dfList = [];
        
        [].forEach.call(tablesToSearch, function (tableToSearch) {
            _obj[self.toObjectProperty(tableToSearch)] = self.jsObject[self.toObjectProperty(tableToSearch)];
            dfList.push(self.parseTable(tableToSearch, _obj));
        });
        
        
        Promise.all(dfList).then(function () {
            
            def.resolve(_obj);
            
        }).error(function () {
            def.reject();
        });
              
    }
    return def.promise;
};

MySQLModel.prototype.find = function (parentObj) {
    var def = Promise.defer();
    var self = this;
    if (!parentObj) {
        parentObj = self.jsObject;
    }
    
    var colsToSearch = [];
    var tablesToSearch = [];
    var noDbProperties = [];
    var manySelectQuery = "";
    
    for (var objectKey in self.jsObject) {
        var colName = self.toRowProperty(objectKey);
        
        if (self.table.columns.indexOf(colName) !== -1 || self.table.primaryKey === colName) {
            
            colsToSearch.push(colName + " = " + self.table.connection.escape(parentObj[objectKey]));

        } else {
            
            //if not a column of this table, maybe it is other table's column/object property example jsObject={userId:3,comments{userId:3}}; find user with user_id =3 and all comments of this user where user_id=3.
            if (self.table.connection.table(colName) !== undefined) {
                //here to check if this is a really table
                tablesToSearch.push(colName);
            } else {
                noDbProperties.push(objectKey);
            }

        }
    }
    
    
    var _query = "SELECT * FROM " + self.table.name + (colsToSearch.length > 0?  " WHERE " + colsToSearch.join(" AND ") : "");
    
    self.table.connection.query(_query, function (err, results) {
        
        if (err || !results) {
            console.dir(err);
            def.reject(err);
        }
        
        var resultsPromises = [];
        [].forEach.call(results, function (result) {
            resultsPromises.push(self.parseResult(result, tablesToSearch));
        });
        
        Promise.all(resultsPromises).then(function (_objects) {
            if (noDbProperties.length > 0) {
                [].forEach.call(_objects, function (theobj) {
                    //put the nodb properties into the object
                    for (var pr = 0; pr < noDbProperties.length; pr++) {
                        theobj[noDbProperties[pr]] = parentObj[noDbProperties[pr]];
                    }
       
                });
            }
            
            def.resolve(_objects);
        });
    });
    
    return def.promise;
};

MySQLModel.prototype.save = function () {
    //sta arguments borw na perniounte ta values me tin seira, ton properties pou exei to model-jsObject
    
    
    var def = Promise.defer();
    var self = this;
    var primaryKeyValue = this[this.table.primaryKey];
    
    
    
    var args = Array.prototype.slice.call(arguments);
    if (args.length > 0) {
        this.values = [];//gia na to ksanakanei toRow pio katw wste na parei ta new values apto jsObject
        
        
        var _keys = Object.keys(this.jsObject);
        
        var shouldIPassThePrimaryKey = false;
        if (primaryKeyValue > 0) {
            shouldIPassThePrimaryKey = true;
        }
        for (var i = -1; i < args.length; i++) {
            if (shouldIPassThePrimaryKey) {
                shouldIPassThePrimaryKey = false;
            } else {
                this.jsObject[_keys[i + 1]] = args[i];
            }
       
        }
        
    
    }
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
            self.primaryKeyValue = result.insertId;
            def.resolve(self.jsObject);

        });
    }
    return def.promise;
};

MySQLModel.prototype.safeDelete = function () {
    var def = Promise.defer();
    
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
        self.jsObject.affectedRows = result.affectedRows;
        def.resolve(self.jsObject);
    });
    
    return def.promise;
};

MySQLModel.prototype.delete = function () {
    var def = Promise.defer();
    var primaryKeyValue = this[this.table.primaryKey];
    if (!primaryKeyValue || primaryKeyValue <= 0) {
        this.toRow();
        var self = this;
        var colummnsAndValues = [];
        for (var i = 0; i < this.columns.length; i++) {
            colummnsAndValues.push(this.columns[i] + "=" + this.table.connection.escape(this.values[i]));
        }
        if (colummnsAndValues.length === 0) {
            def.reject('No criteria found in model! ');
        }
        
        var _query = "DELETE FROM " + this.table.name + " WHERE " + colummnsAndValues.join(' AND ');
        this.table.connection.query(_query, function (err, result) {
            if (err) {
                console.dir(err);
                def.reject(err);
            }
            self.jsObject.affectedRows = result.affectedRows;
            def.resolve(self.jsObject);
        });
    } else {
        return this.safeDelete();
    }
    return def.promise;
};

module.exports = MySQLModel;

