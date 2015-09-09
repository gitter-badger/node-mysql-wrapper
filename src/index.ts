import Connection from "./lib/Connection";
import Wrapper from "./lib/Wrapper";
import {SelectQueryRules} from "./lib/queries/SelectQueryRules";
import CriteriaBuilder from "./lib/CriteriaBuilder";

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

export function wrap(mysqlUrlOrObjectOrMysqlAlreadyConnection: Mysql.IConnection |  string, ...useTables: any[]): Wrapper {
    let mysqlCon = new Connection(mysqlUrlOrObjectOrMysqlAlreadyConnection);
    let mysqlWrapper = new Wrapper(mysqlCon);

    if (useTables) {
        mysqlWrapper.useOnly(useTables);
    }

    return mysqlWrapper;
}

exports.SelectQueryRules =  SelectQueryRules;
exports.CriteriaBuilder = CriteriaBuilder;
