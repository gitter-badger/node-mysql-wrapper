var MySQLModel = require('./mysql-model.js');
var Promise = require('bluebird');

function MySQLWrapper() {
    this.connection;
    this.readyListenerCallbacks = [];
    if (arguments.length > 0) {
        this.setConnection(arguments[0]);
    }
};

MySQLWrapper.prototype.setConnection = function (conObj) {
    this.connection = conObj;
};

MySQLWrapper.prototype.useOnly = MySQLWrapper.prototype.useTables =  function () {
    this.connection.useOnly.apply(this.connection, arguments);
};

MySQLWrapper.prototype.has = function () {
    var args = Array.prototype.slice.call(arguments);
    
    if (args.length === 1) {
        //means table, tables are properties inside here so 
        var tableNameOrFunctionNameOrWhatEver = args[0];
        return this[tableNameOrFunctionNameOrWhatEver] !== undefined;
    } else if (args.length === 2) {
        //first arg is table name and second is a function inside this table, check if exists, so:
        if (this.has(args[0])) {
            return this[args[0]].has(args[1]); // go to table and search if function exists 
        
        }
       
    }
   
};

MySQLWrapper.prototype.ready = function (cb) {
    this.readyListenerCallbacks.push(cb);
    
    if (this.readyListenerCallbacks.length === 1) {
        //means the first listener,so  do the link/connect to the connection now. No before.
        var self = this;
        self.connection.link().then(function () {
            
            //making the functions for each table inside this mysql-connection obj that is wrapped.
            [].forEach.call(self.connection.tables, function (_table) {
                self[MySQLModel.toObjectProperty(_table.name)] = self[_table.name] = _table;
            });
            self.noticeReady();
        });
    }
};

MySQLWrapper.prototype.noticeReady = function () {
    for (var i = 0; i < this.readyListenerCallbacks.length; i++) {
        this.readyListenerCallbacks[i]();
    }
};

MySQLWrapper.prototype.removeReadyListener = function (cb) {
    for (var i = 0; i < this.readyListenerCallbacks.length; i++) {
        if (this.readyListenerCallbacks[i] === cb) {
            this.readyListenerCallbacks.slice(i, 1);
            break;
        }
    }
};

MySQLWrapper.prototype.query = function () {
    this.connection.query.apply(this.connection, arguments);
};

MySQLWrapper.prototype.destroy = function () {
    this.readyListenerCallbacks = [];
    this.connection.destroy();
};

MySQLWrapper.prototype.end = function (maybeAcallbackError) {
    this.readyListenerCallbacks = [];
    this.connection.end(maybeAcallbackError);
};


MySQLWrapper.when = function () {
    var def = Promise.defer();
    var promises = Array.prototype.slice.call(arguments);
    
    if (Array.isArray(arguments[0])) {
        promises = Array.prototype.slice.call(promises[0]);
    } //here I check if first argument is array instead of just a function argument, Promise.all doesnt have this by default...but it should.
    
    
    Promise.all(promises).then(function (results) {
        
        def.resolve(results);
    });
    
    return def.promise;
};

module.exports = MySQLWrapper;