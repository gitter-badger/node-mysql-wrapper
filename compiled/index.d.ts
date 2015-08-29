import MysqlWrapper from "./lib/MysqlWrapper";
import * as Mysql from "mysql";
export declare function wrap(mysqlUrlOrObjectOrMysqlAlreadyConnection: Mysql.IConnection | string, ...useTables: any[]): MysqlWrapper;
