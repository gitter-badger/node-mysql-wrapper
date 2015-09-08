import Connection from "./Connection";
import Helper from "./Helper";
import Table from "./Table";
import {SelectQueryRules} from "./queries/SelectQueryRules";
import * as Promise from 'bluebird';
import * as Mysql from 'mysql';



class Wrapper {
    connection: Connection;
    readyListenerCallbacks = new Array<Function>();            //()=>void

    constructor(connection?: Connection) {
        this.setConnection(connection);
    }

    static when(..._promises: Promise<any>[]): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            //  let promises = Array.prototype.slice.call(arguments);

            if (Array.isArray(_promises[0])) {
                _promises = Array.prototype.slice.call(_promises[0]);
            } //here I check if first argument is array instead of just a function argument, Promise.all doesnt have this by default...but it should.


            Promise.all(_promises).then((results) => {
                resolve(results);
            }).catch((_err: any) => { reject(_err); });

        });
    }

    setConnection(connection: Connection): void {
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
                [].forEach.call(this.connection.tables, (_table: Table<any>) => {
                    this[Helper.toObjectProperty(_table.name)] = this[_table.name] = _table;
                });

                this.noticeReady();

            });
        }
    }

    table<T>(tableName: string): Table<T> {
        return this.connection.table<T>(tableName);
    }

    noticeReady(): void {
        for (let i = 0; i < this.readyListenerCallbacks.length; i++) {
            this.readyListenerCallbacks[i]();
        }
    }

    removeReadyListener(callback: () => void) {
        for (let i = 0; i < this.readyListenerCallbacks.length; i++) {
            if (this.readyListenerCallbacks[i] === callback) {
                this.readyListenerCallbacks.slice(i, 1);
                break;
            }
        }
    }

    query(queryStr: string, callback: (err: Mysql.IError, results: any) => any, queryArguments?: any[]): void {
        this.connection.query(queryStr, callback, queryArguments);
    }

    destroy(): void {
        this.readyListenerCallbacks = [];
        this.connection.destroy();
    }

    end(maybeAcallbackError: (err: any) => void) {
        this.readyListenerCallbacks = [];
        this.connection.end(maybeAcallbackError);
    }

    newTableRules(tableName: string): SelectQueryRules {
        let tbRule = new SelectQueryRules();
        this.table(tableName).rules = tbRule;
        return tbRule;
    }

    buildRules(): SelectQueryRules;
    buildRules(parentRules?: SelectQueryRules): SelectQueryRules {
        let newRules = new SelectQueryRules();
        if (parentRules) {
            newRules.from(parentRules);
        }
        return newRules;
    }

}

export default Wrapper;
