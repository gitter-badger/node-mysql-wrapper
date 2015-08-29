import MysqlConnection from "./MysqlConnection";
import MysqlUtil from "./MysqlUtil";
import {ICriteria, CriteriaBuilder} from "./CriteriaBuilder";

import * as Promise from 'bluebird';
export var EQUAL_TO_PROPERTY_SYMBOL = '=';

class MysqlTable<T> {
    private _name: string;
    private _connection: MysqlConnection;
    private _columns: string[];
    private _primaryKey: string;
    private _criteriaBuilder: CriteriaBuilder<T>;

    constructor(tableName: string, connection: MysqlConnection) {
        this._name = tableName;
        this._connection = connection;
        this._criteriaBuilder = new CriteriaBuilder<T>(this);
    }

    set columns(cols: string[]) {
        this._columns = cols;
    }

    get columns() {
        return this._columns;
    }

    set primaryKey(prkey: string) {
        this._primaryKey = prkey;
    }

    get primaryKey() {
        return this._primaryKey;
    }

    get connection(): MysqlConnection {
        return this._connection;
    }

    get name(): string {
        return this._name;
    }

    on(evtType: string, callback: (parsedResults: any[]) => void): void {
        this.connection.watch(this.name, evtType, callback);
    }

    off(evtType: string, callbackToRemove: (parsedResults: any[]) => void): void {
        this.connection.unwatch(this.name, evtType, callbackToRemove);
    }

    has(extendedFunctionName: string): boolean {
        return this[extendedFunctionName] !== undefined;
    }

    extend(functionName: string, theFunction: (...args: any[]) => any): void {

        var isFunction = !!(theFunction && theFunction.constructor && theFunction.call && theFunction.apply);
        if (isFunction) {
            this[functionName] = theFunction;
        }

    }

    objectFromRow(row: any): any {
        let obj = {};
        MysqlUtil.forEachKey(row, (key) => {
            if (this.columns.indexOf(key) !== -1 || this.primaryKey === key) {
                obj[MysqlUtil.toObjectProperty(key)] = row[key];
            } else {
                obj[key] = row[key]; //for no db properties.
            }
        });
        return obj;
    }

    rowFromObject(obj: any): any {
        let row = {};
        MysqlUtil.forEachKey(obj, (key) => {
            let rowKey = MysqlUtil.toRowProperty(key);
            if (this.columns.indexOf(rowKey) !== -1 || this.primaryKey === rowKey) {
                row[rowKey] = obj[key];
            }
        });
        return row;
    }

    getRowAsArray(jsObject: any): Array<any> {
        let _arr = new Array();
        let _columns = [];
        let _values = [];
        //'of' doesnt works for the properties.
        MysqlUtil.forEachKey(jsObject, (key) => {
            let _col = MysqlUtil.toRowProperty(key);
            //only if this key/property of object is actualy a column (except  primary key)

            if (this.columns.indexOf(_col) !== -1) {
                _columns.push(_col);
                _values.push(jsObject[key]);

            }
        });


        _arr.push(_columns);
        _arr.push(_values);

        return _arr;

    }

    getPrimaryKeyValue(jsObject): number|string {
        var returnValue: string|number = 0;
        var primaryKeyObjectProperty = MysqlUtil.toObjectProperty(this.primaryKey);
        if (jsObject) {
            if (jsObject.constructor === Array) {

            } else {
                if (jsObject.hasOwnProperty(primaryKeyObjectProperty)) {
                    this[this.primaryKey] = jsObject[primaryKeyObjectProperty];

                } else {
                    this[this.primaryKey] = 0;
                }
                // this.primaryKeyValue =
                returnValue = this[this.primaryKey]; //If we want the value but we dont know the of primary key's column's name.
            }
        }
        return returnValue;
    }

    parseQueryResult(result: any, criteria: ICriteria): Promise<any> {
        return new Promise((resolve, reject) => {
            var obj = this.objectFromRow(result);
            if (criteria.tables.length > 0) {
                var tableFindPromiseList = [];
                //tables to search
                criteria.tables.forEach((tableName) => {
                    var table = this.connection.table(tableName);
                    var tablePropertyName = MysqlUtil.toObjectProperty(tableName);
                    var criteriaJsObject = MysqlUtil.copyObject(criteria.rawCriteriaObject[tablePropertyName]);
                    MysqlUtil.forEachKey(criteriaJsObject, (propertyName) => {
                        if (criteriaJsObject[propertyName] === EQUAL_TO_PROPERTY_SYMBOL) {
                            criteriaJsObject[propertyName] = result[MysqlUtil.toRowProperty(propertyName)];
                        }
                    });
                    var tableFindPromise = table.find(criteriaJsObject);

                    tableFindPromise.then((childResults) => {
                        obj[tablePropertyName] = [];

                        childResults.forEach((childResult) => {
                            obj[tablePropertyName].push(this.objectFromRow(childResult));

                        });
                    });
                    tableFindPromiseList.push(tableFindPromise);

                });

                Promise.all(tableFindPromiseList).then(() => {
                    resolve(obj);
                });

            } else {
                resolve(obj);
            }

        });
    }

    find(criteriaRawJsObject: any, callback?: (_results: T[]) => any): Promise<T[]> {
        return new Promise<T[]>((resolve, reject) => {

            var criteria = this._criteriaBuilder.build(criteriaRawJsObject);

            var query = "SELECT * FROM " + this.name + criteria.whereClause;

            this.connection.query(query, (error, results: any[]) => {
                if (error || !results) {
                    reject(error + ' Error. On find');
                }
                var parseQueryResultsPromises = [];

                results.forEach((result) => {
                    parseQueryResultsPromises.push(this.parseQueryResult(result, criteria));

                });

                Promise.all(parseQueryResultsPromises).then((_objects: T[]) => {
                    resolve(_objects);
                    if (callback) {
                        callback(_objects);
                    }
                });

            });


        });
    }

    findById(id: number|string, callback?: (result: T) => any): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            let criteria = {};
            criteria[this.primaryKey] = id;
            this.find(criteria).then((results) => {
                resolve(results[0]);
                if (callback) {
                    callback(results[0]);
                }
            }).catch((err: any) => reject(err));

        });
    }

    findAll(callback?: (_results: T[]) => any): Promise<T[]> {
        return this.find({}, callback);
    }

    save(criteriaRawJsObject: any, callback?: (_result: any) => any): Promise<any> {
        //sta arguments borw na perniounte ta values me tin seira, ton properties pou exei to model-jsObject
        return new Promise<any>((resolve, reject) => {
            var primaryKeyValue = this.getPrimaryKeyValue(criteriaRawJsObject);

            //14-08-2015 always run getRowAsArray before save.  if (this.columns.length === 0 || this.values.length === 0) {
            var arr = this.getRowAsArray(criteriaRawJsObject);
            var objectColumns = arr[0]; // = columns , 1= values
            var objectValues = arr[1];
            //   }
            var obj = this.objectFromRow(criteriaRawJsObject);
            if (primaryKeyValue > 0) {
                //update
                var colummnsAndValuesStr = "";
                for (let i = 0; i < objectColumns.length; i++) {
                    colummnsAndValuesStr += "," + objectColumns[i] + "=" + this.connection.escape(objectValues[i]);
                }
                colummnsAndValuesStr = colummnsAndValuesStr.substring(1);
                var _query = "UPDATE " + this.name + " SET " + colummnsAndValuesStr + " WHERE " + this.primaryKey + " =  " + primaryKeyValue;
                this.connection.query(_query, (err, result) => {
                    if (err) {
                        // console.dir(err);
                        reject(err);

                    }
                    this.connection.notice(this.name, _query, obj);
                    resolve(obj);
                    if (callback) {
                        callback(obj); //an kai kanonika auto to kanei mono t
                    }
                });

            } else {
                //create
                var _query = "INSERT INTO ?? (??) VALUES(?) ";
                this.connection.query(_query, (err, result) => {
                    if (err) { // console.dir(err);
                        reject(err);
                    }
                    // jsObject[this.primaryKey] = result.insertId;

                    var primaryKeyJsObjectProperty = MysqlUtil.toObjectProperty(this.primaryKey);

                    obj[primaryKeyJsObjectProperty] = result.insertId;
                    //criteriaRawJsObject[primaryKeyJsObjectProperty] = result.insertId;
                    primaryKeyValue = result.insertId;

                    this.connection.notice(this.name, _query, obj);
                    resolve(obj);
                    if (callback) {
                        callback(obj);
                    }


                }, [this.name, objectColumns, objectValues]);
            }
        });
    }




	   safeRemove(id: number|string, callback?: (_result: { affectedRows: number; table: string }) => any): Promise<{ affectedRows: number; table: string }> {
        return new Promise<{ affectedRows: number; table: string }>((resolve, reject) => {


            let _query = "DELETE FROM " + this.name + " WHERE " + this.primaryKey + " = " + id;
            this.connection.query(_query, (err, result) => {
                if (err) {
                    // console.dir(err);
                    reject(err);
                }
                let _objReturned = { affectedRows: result.affectedRows, table: this.name };

                this.connection.notice(this.name, _query, [_objReturned]);
                resolve(_objReturned);
                if (callback) {
                    callback(_objReturned); //an kai kanonika auto to kanei mono t
                }
            });

        });
    }
	
    /*safeRemove(criteriaRawJsObject: any, callback?: (_result: { affectedRows; table }) => any): Promise<{ affectedRows; table }> {
        return new Promise<{ affectedRows; table }>((resolve, reject) => {

            let primaryKeyValue = this.getPrimaryKeyValue(criteriaRawJsObject);
            if (primaryKeyValue <= 0) {
                reject('Primary Key is missing!');
            }

            let _query = "DELETE FROM " + this.name + " WHERE " + this.primaryKey + " = " + primaryKeyValue;
            this.connection.query(_query, (err, result) => {
                if (err) {
                    // console.dir(err);
                    reject(err);
                }
                let _objReturned = { affectedRows: result.affectedRows, table: this.name };

                this.connection.notice(this.name, _query, [_objReturned]);
                resolve(_objReturned);
                if (callback) {
                    callback(_objReturned); //an kai kanonika auto to kanei mono t
                }
            });

        });
    }*/

    remove(criteriaRawJsObject: any, callback?: (_result: { affectedRows: number; table: string }) => any): Promise<{ affectedRows: number; table: string }> {
        return new Promise<{ affectedRows: number; table: string }>((resolve, reject) => {
            let primaryKeyValue = this.getPrimaryKeyValue(criteriaRawJsObject);
            if (!primaryKeyValue || primaryKeyValue <= 0) {
                let arr = this.getRowAsArray(criteriaRawJsObject);
                let objectValues = arr[1];
                let colummnsAndValues = [];
                for (let i = 0; i < colummnsAndValues.length; i++) {
                    colummnsAndValues.push(colummnsAndValues[i] + "=" + this.connection.escape(objectValues[i]));
                }
                if (colummnsAndValues.length === 0) {
                    reject('No criteria found in model! ');
                }

                let _query = "DELETE FROM " + this.name + " WHERE " + colummnsAndValues.join(' AND ');
                this.connection.query(_query, (err, result) => {
                    if (err) {
                        //console.dir(err);
                        reject(err);
                    }
                    let _objReturned = { affectedRows: result.affectedRows, table: this.name };

                    this.connection.notice(this.name, _query, [_objReturned]);
                    resolve(_objReturned);
                    if (callback) {
                        callback(_objReturned);  //an kai kanonika auto to kanei mono t
                    }
                });
            } else {
                // return this.safeRemove(jsObject);
                this.safeRemove(criteriaRawJsObject).then((_res) => {
                    resolve(_res);
                });
            }
        });
    }


}

export default  MysqlTable;
