import MysqlConnection from "./lib/MysqlConnection";
import MysqlWrapper from "./lib/MysqlWrapper";
import * as Mysql from "mysql";

if (Function.prototype["name"] === undefined) {
    //works only for function something() {}; no for var something = function(){}
    // Add a custom property to all function values
    // that actually invokes a method to get the value
    Object.defineProperty(Function.prototype, 'name', {
        get: function() {
            return /function ([^(]*)/.exec(this + "")[1];
        }
    });
}

export  function wrap(mysqlUrlOrObjectOrMysqlAlreadyConnection: Mysql.IConnection |  string, ...useTables: any[]): MysqlWrapper {
    let mysqlCon = new MysqlConnection(mysqlUrlOrObjectOrMysqlAlreadyConnection);
    let mysqlWrapper = new MysqlWrapper(mysqlCon);

    if (useTables) {
        mysqlWrapper.useOnly(useTables);
    }

    return mysqlWrapper;
}
