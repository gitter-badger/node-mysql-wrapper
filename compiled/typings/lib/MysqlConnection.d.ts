/// <reference path="../../src/typings/mysql/mysql.d.ts" />
/// <reference path="../../src/typings/bluebird/bluebird.d.ts" />
/// <reference path="MysqlTable.d.ts" />
import * as Mysql from 'mysql';
import * as Promise from 'bluebird';
import MysqlTable from "./MysqlTable";
declare class MysqlConnection {
    connection: Mysql.IConnection;
    eventTypes: string[];
    tableNamesToUseOnly: any[];
    tables: MysqlTable[];
    constructor(connection: string | Mysql.IConnection);
    create(connection: string | Mysql.IConnection): void;
    attach(connection: Mysql.IConnection): void;
    end(callback?: (error: any) => void): void;
    destroy(): void;
    link(readyCallback?: () => void): Promise<void>;
    useOnly(...tables: any[]): void;
    fetchDatabaseInfornation(): Promise<void>;
    escape(val: string): string;
    notice(tableWhichCalled: string, queryStr: string, parsedResults: any[]): void;
    watch(tableName: string, evtType: any, callback: (parsedResults: any[]) => void): void;
    unwatch(tableName: string, evtType: string, callbackToRemove: (parsedResults: any[]) => void): void;
    query(queryStr: string, callback: (err: Mysql.IError, results: any) => any, queryArguments?: any[]): void;
    table(tableName: string): MysqlTable;
}
export default MysqlConnection;
