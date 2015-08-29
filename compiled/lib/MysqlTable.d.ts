import MysqlConnection from "./MysqlConnection";
import { ICriteria } from "./CriteriaBuilder";
import * as Promise from 'bluebird';
export declare var EQUAL_TO_PROPERTY_SYMBOL: string;
declare class MysqlTable<T> {
    private _name;
    private _connection;
    private _columns;
    private _primaryKey;
    private _criteriaBuilder;
    constructor(tableName: string, connection: MysqlConnection);
    columns: string[];
    primaryKey: string;
    connection: MysqlConnection;
    name: string;
    on(evtType: string, callback: (parsedResults: any[]) => void): void;
    off(evtType: string, callbackToRemove: (parsedResults: any[]) => void): void;
    has(extendedFunctionName: string): boolean;
    extend(functionName: string, theFunction: (...args: any[]) => any): void;
    objectFromRow(row: any): any;
    rowFromObject(obj: any): any;
    getRowAsArray(jsObject: any): Array<any>;
    getPrimaryKeyValue(jsObject: any): number | string;
    parseQueryResult(result: any, criteria: ICriteria): Promise<any>;
    find(criteriaRawJsObject: any, callback?: (_results: T[]) => any): Promise<T[]>;
    findById(id: number | string, callback?: (result: T) => any): Promise<T>;
    findAll(callback?: (_results: T[]) => any): Promise<T[]>;
    save(criteriaRawJsObject: any, callback?: (_result: any) => any): Promise<any>;
    safeRemove(id: number | string, callback?: (_result: {
        affectedRows: number;
        table: string;
    }) => any): Promise<{
        affectedRows: number;
        table: string;
    }>;
    remove(criteriaRawJsObject: any, callback?: (_result: {
        affectedRows: number;
        table: string;
    }) => any): Promise<{
        affectedRows: number;
        table: string;
    }>;
}
export default MysqlTable;
