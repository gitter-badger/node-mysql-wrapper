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
    this.modelObj = new MySQLModel(this);

};

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
    return this.modelObj.reUse(jsObject);
};

MySQLTable.prototype.watch = MySQLTable.prototype.on = function (eventType, theCallbackFuncWhichWillTheEventAndDataAsArgumentPass) {
    this.connection.watch(this.name, eventType, theCallbackFuncWhichWillTheEventAndDataAsArgumentPass);
};


MySQLTable.prototype.unwatch = MySQLTable.prototype.off = function (eventType, callbackToRemove) {
    this.connection.unwatch(this.name, eventType, callbackToRemove);
};
/* expose functionality from model, to be easier to use wrapper.table.find/save/delete/safeDelete(jsObject) .... also use callbacks if user wants it*/

MySQLModel.methods.forEach(function (fn) {
    MySQLTable.prototype[fn] = function (jsObject, cb) {
        var model;
        if (jsObject instanceof MySQLModel) {
            model = jsObject;
        } else {
            model = this.model(jsObject);
        }
        
        var promise = model[fn]();
        if (cb) {
            promise.then(cb);
            
        } else {
            return promise;
        }
    };
    
});

MySQLTable.prototype["findAll"] = function (cb) {
    var promise = this.modelObj.findAll();
    if (cb) {
        promise.then(cb);
            
    } else {
        return promise;
    }

};

MySQLTable.prototype.extend = function () { //these are shared custom functions for all models inside this table.
    var args = Array.prototype.slice.call(arguments);
    
    if (args.length > 1) {
        var nameOfFunction = args[0];
        var _theFunction = args[1];
        
        var isFunction = !!(_theFunction && _theFunction.constructor && _theFunction.call && _theFunction.apply);
        if (isFunction) {
            
            this[nameOfFunction] = _theFunction;
        }
    }

};
MySQLTable.prototype.has = function (extendedFunctionName) {
    return this[extendedFunctionName] !== undefined;
};

module.exports = MySQLTable;

