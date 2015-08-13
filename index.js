var _mysqlConMod = require('./lib/mysql-connection');
var mysqlWrapperMod = require('./lib/mysql-wrapper.js');
if (Function.prototype.name === undefined) {
    //works only for function something() {}; no for var something = function(){}
    // Add a custom property to all function values
    // that actually invokes a method to get the value
    Object.defineProperty(Function.prototype, 'name', {
        get: function () {
            return /function ([^(]*)/.exec(this + "")[1];
        }
    });
}

module.exports = function (mysqlUrlOrObjectOrMysqlAlreadyConnection) {
    var mysqlCon = new _mysqlConMod(mysqlUrlOrObjectOrMysqlAlreadyConnection);
    var mysqlWrapper = new mysqlWrapperMod(mysqlCon);
    if (arguments.length > 1) {
        var args = [].slice.call(arguments);
        args.shift();
        mysqlWrapper.useOnly(args);
    }

    return mysqlWrapper;
};

