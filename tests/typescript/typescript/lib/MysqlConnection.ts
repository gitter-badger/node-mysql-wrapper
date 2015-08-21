/// <reference path="./../Scripts/typings/mysql/mysql.d.ts"/>
/// <reference path="./../Scripts/typings/bluebird/bluebird.d.ts"/> 

import Mysql = require('mysql');
import Util = require('util');
import Promise = require('bluebird');
import EventModule = require('events');
import EventEmitter = EventModule.EventEmitter;

import {MysqlTable} from "MysqlTable";
/* prostoparwn den xrisimopoiounte , akoma tlxstn
export enum EventTypes {
    Insert, Update, Remove, Save

}*/

export class MysqlConnection {
    connection: Mysql.IConnection;
    eventTypes = ["INSERT", "UPDATE", "REMOVE", "SAVE"];
    tableNamesToUseOnly = [];
    tables: MysqlTable[] = [];

    constructor(connection: string | Mysql.IConnection) {
        this.create(connection);
        Util.inherits(this, EventEmitter);
    }

    create(connection: string | Mysql.IConnection): void {
        if (typeof connection === "string") {
            this.attach(Mysql.createConnection(connection));

        } else {   //means that is mysql already connection
            this.attach(connection);
        }
    }

    attach(connection: Mysql.IConnection): void {
        this.connection = connection;
    }

    end(callback?: (error: any) => void): void {
        this["removeAllListeners"](this.eventTypes);
        this.connection.end((err) => {
            // The connection is terminated now
            callback(err);

        });
    }

    destroy(): void {
        this["removeAllListeners"](this.eventTypes);
        this.connection.destroy();
    }

    link(readyCallback?: () => void): Promise<any> {
        let def = Promise.defer();
        let callback = readyCallback() ||
            ((err: any) => {
                if (err) {
                    console.error('MYSQL: error connecting: ' + err.stack);
                    def.reject(err.stack);

                }

                //console.log('MYSQL: connected as id ' + self.connection.threadId);
                this.fetchDatabaseInfornation().then(() => {
                    def.resolve();
                    // self.noticeReady();
                });


            });

        // if (this.connection.state === 'authenticated') {
        if (this.connection['state'] === 'authenticated') {
            readyCallback();
            def.resolve();
        } else {
            this.connection.connect(callback);
        }

        return def.promise;
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

        let def = Promise.defer();
        let self = this;

        self.connection.query("SELECT DISTINCT TABLE_NAME ,column_name FROM INFORMATION_SCHEMA.key_column_usage WHERE TABLE_SCHEMA IN ('" + self.connection.config.database + "');", function (err, results) {

            [].forEach.call(results, function (tableObj, currentPosition) {
                if (self.tableNamesToUseOnly.length > 0 && self.tableNamesToUseOnly.indexOf(tableObj.TABLE_NAME) === -1) {
                    //means that only to use called, and this table is not in this collection, so don't fetch it.
                } else {
                    let _table = new MysqlTable(tableObj.TABLE_NAME, self);
                    _table.primaryKey = (tableObj.column_name);

                    self.connection.query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '" + self.connection.config.database + "' AND TABLE_NAME = '" + _table.name + "';", function (errC, resultsC) {
                        let _tableColumns = [];

                        for (let i = 0; i < resultsC.length; i++) {
                            let _columnName = resultsC[i].COLUMN_NAME;
                            if (_columnName !== _table.primaryKey) {
                                _tableColumns.push(_columnName);
                            }
                        }

                        _table.columns = (_tableColumns);
                        self.tables.push(_table);

                        if (currentPosition === results.length - 1) {
                            //otan teleiwsoume me ola
                        
                            def.resolve();
                        }

                    });
                }
            });


        });

        return <any>(def.promise);
    }

    escape(val: string): string {
        return this.connection.escape(val);
    }

    notice(tableWhichCalled: string, queryStr: string, parsedResults: any[]): void {
        let evtType;
        //get the first word from the query, usualy is INSERT OR UPDATE OR DELETE OR SELECT
        if (queryStr.indexOf(' ') === -1) {
            evtType = undefined;
        } else {
            evtType = queryStr.substr(0, queryStr.indexOf(' ')).toUpperCase();
        }

        if (evtType !== undefined) {
            if (evtType === 'INSERT' || evtType === 'UPDATE') {
                this["emit"](tableWhichCalled.toUpperCase() + ".SAVE", parsedResults);
            }
            this["emit"](tableWhichCalled.toUpperCase() + "." + evtType, parsedResults);
        }
    }

    //evtType:  EventTypes[]  | EventTypes | string,
    watch(tableName: string, evtType: any, callback: (parsedResults: any[]) => void): void {
        if (Array.isArray(evtType)) {
            //if it is array then we catch more than one event with the same callback, this maybe will be 'helpy' to some devs
            for (let i = 0; i < evtType.length; i++) {
                let _theEventType = evtType[i].toUpperCase();
                if (this.eventTypes.indexOf(_theEventType) !== -1) {
                    this["on"](tableName.toUpperCase() + "." + _theEventType, callback);
                }
            }
        } else {
            evtType = evtType.toUpperCase();
            if (this.eventTypes.indexOf(evtType) !== -1) {
                this["on"](tableName.toUpperCase() + "." + evtType, callback);
            }
        }
    }

    //evtType: EventTypes 
    unwatch(tableName: string, evtType: string, callbackToRemove: (parsedResults: any[]) => void): void {

        evtType = evtType.toUpperCase();
        if (this.eventTypes.indexOf(evtType) !== -1) {
            this["removeListener"](tableName.toUpperCase() + "." + evtType, callbackToRemove);
        }
    }

    query(queryStr: string, callback: (err: Mysql.IError, results: any) => any, queryArguments?: any[]): void {
   
        var args = Array.prototype.slice.call(arguments);
        queryStr = args[0];

        if (queryArguments) {         
                                    
            this.connection.query(queryStr, queryArguments, function (err, results) {
                callback(err, results);
            });
        } else {        //means only: queryStr and the callback
          
            this.connection.query(queryStr, function (err, results) {
                callback(err, results);
            }); 
        } 
    }

    table(tableName: string): MysqlTable {
        for (let i = 0; i < this.tables.length; i++) {

            if (this.tables[i].name === tableName) {

                return this.tables[i];
            }
        }
        return undefined;
    }


}

