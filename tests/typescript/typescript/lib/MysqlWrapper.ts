import {MysqlConnection} from "MysqlConnection";
import * as Promise from 'bluebird';
import * as Mysql from 'mysql';
import {MysqlTable} from "MysqlTable";


export class MysqlWrapper {
    connection: MysqlConnection;
    readyListenerCallbacks = new Array<Function>();            //()=>void

    constructor(connection?: MysqlConnection) {
        this.setConnection(connection);
    }

    static when(..._promises:Promise<any>[]): Promise<any> {
        let def = Promise.defer();
      //  let promises = Array.prototype.slice.call(arguments);

        if (Array.isArray(_promises[0])) {
            _promises = Array.prototype.slice.call(_promises[0]);
        } //here I check if first argument is array instead of just a function argument, Promise.all doesnt have this by default...but it should.
    
    
        Promise.all(_promises).then((results) => {
            def.resolve(results);
        });
        return def.promise;
    }

    setConnection(connection: MysqlConnection): void {
        this.connection = connection;
    }

    useOnly(...useTables: any[]): void {
        this.connection.useOnly(useTables);
    }

    has(tableName: string, functionName?: string): boolean {
        if (this[tableName] !== undefined) {
            if (functionName) {
                return this[tableName][functionName] !== undefined;
            } else {
                return true;
            }
        }

        return false;

    }

    ready(callback: () => void): void {
        this.readyListenerCallbacks.push(callback);

        if (this.readyListenerCallbacks.length === 1) {
            //means the first listener,so  do the link/connect to the connection now. No before.

            this.connection.link().then(() => {
                [].forEach.call(this.connection.tables, (_table: MysqlTable) => {
                    this[MysqlTable.toObjectProperty(_table.name)] = this[_table.name] = _table;
                });

                this.noticeReady();

            });
        }
    }

    table(tableName: string) {
        return this.connection.table(tableName);
    }

    noticeReady(): void {
        for (let i = 0; i < this.readyListenerCallbacks.length; i++) {
            this.readyListenerCallbacks[i]();
        }
    }

    removeReadyListener(callback: () => void) {
        for (var i = 0; i < this.readyListenerCallbacks.length; i++) {
            if (this.readyListenerCallbacks[i] === callback) {
                this.readyListenerCallbacks.slice(i, 1);
                break;
            }
        }
    }

    query(queryStr: string, callback: (err: Mysql.IError, results: any) => any, queryArguments?: any[]): void {
        this.connection.query(queryStr, callback, queryArguments);
    }

    destroy() {
        this.readyListenerCallbacks = [];
        this.connection.destroy();
    }

    end(maybeAcallbackError: (err: any) => void) {
        this.readyListenerCallbacks = [];
        this.connection.end(maybeAcallbackError);
    }

}