/// <reference path="../typings/mysql/mysql.d.ts"/>
/// <reference path="../typings/bluebird/bluebird.d.ts"/> 
/// <reference path="./MysqlTable.ts"/> 
import * as Mysql from 'mysql';
import * as Util from 'util';
import * as Promise from 'bluebird';
import {EventEmitter} from 'events';
import MysqlTable from "./MysqlTable";
import MysqlUtil from "./MysqlUtil";

class MysqlConnection extends EventEmitter {
    connection: Mysql.IConnection;
    eventTypes = ["INSERT", "UPDATE", "REMOVE", "SAVE"];
    tableNamesToUseOnly = [];
    tables: MysqlTable<any>[] = [];

    constructor(connection: string | Mysql.IConnection) {
        super();
        this.create(connection);
    }

    create(connection: string | Mysql.IConnection): void {
        if (typeof connection === "string" || connection instanceof String) {
            this.attach(Mysql.createConnection(connection));

        } else {   //means that is mysql already connection
            this.attach(connection);
        }
    }

    attach(connection: Mysql.IConnection): void {
        this.connection = connection;
    }

    end(callback?: (error: any) => void): void {
        this.eventTypes.forEach(_evt=> {
            this.removeAllListeners(_evt);
        });
        this.connection.end((err) => {
            // The connection is terminated now
            callback(err);

        });
    }

    destroy(): void {
        this.eventTypes.forEach(_evt=> {
            this.removeAllListeners(_evt);
        });
        this.connection.destroy();
    }

    link(readyCallback?: () => void): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let callback: Function = readyCallback ||
                ((err: any) => {
                    if (err) {
                        console.error('MYSQL: error connecting: ' + err.stack);
                        reject(err.stack);

                    }

                    //console.log('MYSQL: connected as id ' + self.connection.threadId);
                    this.fetchDatabaseInfornation().then(() => {
                        resolve();
                        // self.noticeReady();
                    });


                });

            // if (this.connection.state === 'authenticated') {
            if (this.connection['state'] === 'disconnected' || this.connection['state'] === 'connecting') {
                this.connection.connect(callback);
            } else {   //means this.connection['state'] === 'authenticated', so just callback and promise resolve.
                callback();
                resolve();
            }

        });
    }

    useOnly(...tables: any[]): void {
        for (let i = 0; i < tables.length; i++) {
            let _table = tables[i];
            if (typeof _table === 'string' || _table instanceof String) {
                //it is just the table name string
                this.tableNamesToUseOnly.push(_table);
            } else {
                //it is an array of strings
                for (let j = 0; j < _table.length; j++) {
                    this.tableNamesToUseOnly.push(_table[j]);
                }
            }
        }
    }

    fetchDatabaseInfornation(): Promise<void> {
        //Ta kanw ola edw gia na doulepsei to def.resolve kai na einai etoimo olo to module molis ola ta tables kai ola ta columns dhlwthoun.

        return new Promise<void>((resolve, reject) => {
            //ta results pou 9eloume einai panta ta: results[0]. 
            this.connection.query("SELECT DISTINCT TABLE_NAME ,column_name FROM INFORMATION_SCHEMA.key_column_usage WHERE TABLE_SCHEMA IN ('" + this.connection.config.database + "');",
                (err: Mysql.IError, ...results: any[]) => {
                    if (err) {
                        reject(err);
                    }
                    if (results.length > 0 && Array.isArray(results[0]) && results[0].length > 0) {
                        results[0].forEach((tableObj, currentPosition) => {
                            //.log(tableObj.TABLE_NAME);
                            if (this.tableNamesToUseOnly.length > 0 && this.tableNamesToUseOnly.indexOf(tableObj.TABLE_NAME) !== -1) {
                                //means that only to use called, and this table is not in this collection, so don't fetch it.

                            } else {
                                let _table = new MysqlTable(tableObj.TABLE_NAME, this);
                                _table.primaryKey = (tableObj.column_name);

                                this.connection.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '" + this.connection.config.database + "' AND TABLE_NAME = '" + _table.name + "';", (errC: Mysql.IError, ...resultsC: any[]) => {
                                    if (errC) {
                                        reject(err);
                                    }

                                    let _tableColumns = [];

                                    for (let i = 0; i < resultsC[0].length; i++) {

                                        let _columnName = resultsC[0][i]['COLUMN_NAME']; //.COLUMN_NAME
                                        if (_columnName !== _table.primaryKey) {
                                            _tableColumns.push(_columnName);
                                        }
                                    }

                                    _table.columns = (_tableColumns);
                                    this.tables.push(_table);
                                    //console.log('pushing ' + _table.name + ' with primary: ' + _table.primaryKey + ' and columns: ');
                                    // console.dir(_table.columns);
                                    if (currentPosition === results[0].length - 1) {
                                        //otan teleiwsoume me ola

                                        resolve();
                                    }

                                });
                            }
                        });
                    } else {
                        reject("No infromation can be fetched by your database, please check your permissions");
                    }

                });

        });
    }

    escape(val: string): string {
        return this.connection.escape(val);
    }

    notice(tableWhichCalled: string, queryStr: string, parsedResults: any[]): void {
        let evtType;
        //get the first word from the query, usualy is INSERT OR UPDATE OR DELETE (which is 'REMOVE').
        if (queryStr.indexOf(' ') === -1) {
            evtType = undefined;
        } else {
            evtType = queryStr.substr(0, queryStr.indexOf(' ')).toUpperCase();
        }

        if (evtType !== undefined) {
            if (evtType === 'INSERT' || evtType === 'UPDATE') {
                this.emit(tableWhichCalled.toUpperCase() + ".SAVE", parsedResults);
            } else if (evtType === 'DELETE') {
                this.emit(tableWhichCalled.toUpperCase() + ".REMOVE", parsedResults);
            }
            this.emit(tableWhichCalled.toUpperCase() + "." + evtType, parsedResults);
        }
    }

    //evtType:  EventTypes[]  | EventTypes | string,
    watch(tableName: string, evtType: any, callback: (parsedResults: any[]) => void): void {
        if (Array.isArray(evtType)) {
            //if it is array then we catch more than one event with the same callback, this maybe will be 'helpy' to some devs
            for (let i = 0; i < evtType.length; i++) {
                let _theEventType = evtType[i].toUpperCase();
                if (this.eventTypes.indexOf(_theEventType) !== -1) {
                    this.on(tableName.toUpperCase() + "." + _theEventType, callback);
                }
            }
        } else {
            evtType = evtType.toUpperCase();
            if (this.eventTypes.indexOf(evtType) !== -1) {
                this.on(tableName.toUpperCase() + "." + evtType, callback);
            }
        }
    }

    //evtType: EventTypes 
    unwatch(tableName: string, evtType: string, callbackToRemove: (parsedResults: any[]) => void): void {

        evtType = evtType.toUpperCase();
        if (this.eventTypes.indexOf(evtType) !== -1) {
            this.removeListener(tableName.toUpperCase() + "." + evtType, callbackToRemove);
        }
    }

    query(queryStr: string, callback: (err: Mysql.IError, results: any) => any, queryArguments?: any[]): void {

        if (queryArguments) {

            this.connection.query(queryStr, queryArguments, (err, results) => {
                callback(err, results);
            });
        } else {        //means only: queryStr and the callback
          
            this.connection.query(queryStr, (err, results) => {
                callback(err, results);
            });
        }
    }

    table<T>(tableName: string): MysqlTable<T> {
        for (let i = 0; i < this.tables.length; i++) {
            if (this.tables[i].name === tableName || this.tables[i].name === MysqlUtil.toObjectProperty(tableName)) {

                return this.tables[i];
            }
        }
        return undefined;
    }


}

export default MysqlConnection;