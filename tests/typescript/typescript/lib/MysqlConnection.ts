/// <reference path="./../Scripts/typings/mysql/mysql.d.ts"/>
/// <reference path="./../Scripts/typings/bluebird/bluebird.d.ts"/> 

import Mysql = require('mysql');
import Util = require('util');
import Promise = require('bluebird');
import EventModule = require('events');
import EventEmmiter = EventModule.EventEmitter;

import {MysqlTable} from "MysqlTable";

export enum EventTypes {
    Insert, Update, Delete, Save

}

export class MysqlConnection {


    constructor(connection: string | Mysql.IConnection) {
        this.create(connection);

    }

    create(connection: string | Mysql.IConnection): void {

    }

    attach(connection: Mysql.IConnection): void {

    }

    end(callback?: () => void): void {

    }

    destroy(): void {

    }

    link(): void {

    }

    useOnly(...tables: string[]): void {

    }

    fetchDatabaseInfornation(): Promise<void> {

        var def = Promise.defer();

        def.resolve();

        return <any>(def.promise);
    }

    escape(val: string): string {
        return "";
    }

    notice(table: string, query: string, parsedResults: any[]): void {

    }

    watch(table: string, evtType: EventTypes, callback: (parsedResults: any[]) => void): void {

    }

    unwatch(table: string, evtType: EventTypes, callbackToRemove: (parsedResults: any[]) => void): void {

    }

    query(query: string, callback: (err: string, results: any) => any, queryArguments?: any[]): void {

    }

    table(table: string): MysqlTable {
        return new MysqlTable('test',this);
    }

}

