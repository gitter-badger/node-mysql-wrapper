import MysqlConnection from "./MysqlConnection";
import * as Promise from 'bluebird';
import * as Mysql from 'mysql';
import MysqlTable from "./MysqlTable";
declare class MysqlWrapper {
    connection: MysqlConnection;
    readyListenerCallbacks: Function[];
    constructor(connection?: MysqlConnection);
    static when(..._promises: Promise<any>[]): Promise<any>;
    setConnection(connection: MysqlConnection): void;
    useOnly(...useTables: any[]): void;
    has(tableName: string, functionName?: string): boolean;
    ready(callback: () => void): void;
    table<T>(tableName: string): MysqlTable<T>;
    noticeReady(): void;
    removeReadyListener(callback: () => void): void;
    query(queryStr: string, callback: (err: Mysql.IError, results: any) => any, queryArguments?: any[]): void;
    destroy(): void;
    end(maybeAcallbackError: (err: any) => void): void;
}
export default MysqlWrapper;
