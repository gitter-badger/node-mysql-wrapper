import Table from "./Table";
import {SelectQueryRules} from "./SelectQueryRules";
import * as Promise from 'bluebird';

class SelectQuery<T> { // T for Table's result type.
    private _rules: SelectQueryRules;
    private _table: Table<T>;
    private _criteriaRawJsObject: any;
    private _callback: (_results: T[]) => any;
    private callback: (resolve?: (thenableOrResult?: T | Promise.Thenable<T>) => void, reject?: (error?: any) => void) => void;

    constructor(table: Table<T>, criteriaRawJsObject: any, callback?: (_results: T[]) => any) {
        this._table = table;
        this._criteriaRawJsObject = criteriaRawJsObject;
        this._rules = new SelectQueryRules().from(this._table.rules); // Helper.copyObject<SelectQueryRules>(this._table.rules);
        this._callback = callback;

    }

    orderBy(columnKey: string, descending?: boolean): SelectQuery<T> {
        this._rules.orderBy(columnKey, descending);
        return this;
    }

    groupBy(columnKey: string): SelectQuery<T> {
        this._rules.groupBy(columnKey);
        return this;
    }

    limit(limitRowsOrStart: number, limitEnd?: number): SelectQuery<T> {
        this._rules.limit(limitRowsOrStart, limitEnd);
        return this;
    }
    
    /**
     * Executes the select and returns the Promise.
     */
    promise(): Promise<T[]> {
        return new Promise<T[]>((resolve, reject) => {

            let criteria = this._table.criteriaBuilder.build(this._criteriaRawJsObject);

            let queryRules = this._rules.toString();
            //  if (rulesOrCallback !== undefined && !MysqlUtil.isFunction(rulesOrCallback)) {
            //         queryRules = rulesOrCallback.toString();

            //     }
            let query = "SELECT * FROM " + this._table.name + criteria.whereClause + queryRules;

            this._table.connection.query(query, (error, results: any[]) => {
                if (error || !results) {
                    reject(error + ' Error. On find');
                }
                let parseQueryResultsPromises = [];

                results.forEach((result) => {
                    parseQueryResultsPromises.push(this._table.parseQueryResult(result, criteria));

                });

                Promise.all(parseQueryResultsPromises).then((_objects: T[]) => {


                    if (this._callback !== undefined) {
                        this._callback(_objects);
                    }

                    resolve(_objects);
                });

            });
        });

    }
    
    /**
     * Exactly the same thing as promise().
     * Executes the select and returns the Promise.
    */
    execute(): Promise<T[]> {
        return this.promise();
    }

    then(onFulfill: (value: any[]) => any|Promise.Thenable<any>): Promise<any>;
    then<U>(onFulfill: (value: T[]) => U|Promise.Thenable<U>, onReject: (error: any) => Promise.Thenable<U>, onProgress?: (note: any) => any): Promise<U>;
    then<U>(onFulfill: (value: T[]) => U|Promise.Thenable<U>, onReject?: (error: any) => U, onProgress?: (note: any) => any): Promise<U> {
        return this.promise().then(onFulfill, onReject, onProgress);
    }
}

export default SelectQuery;