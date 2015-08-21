//import {MysqlConnection, EventTypes} from "MysqlConnection";
import {MysqlConnection} from "MysqlConnection";
import * as Promise from 'bluebird';
export var EQUAL_TO_PROPERTY_SYMBOL = '=';

export class MysqlTable {
    name: string;
    connection: MysqlConnection;
    private _columns: string[];
    private _primaryKey: string;

    constructor(tableName: string, connection: MysqlConnection) {
        this.name = tableName;
        this.connection = connection;

        //edw to forEach gia ta functions tou Model.an den ta valw ola sto table, logika 9a ginete.
    }

    static toObjectProperty(columnKey): string {
        //convert column_key to objectKey
        return columnKey.replace(/(_.)/g, (x) => { return x[1].toUpperCase() });
    }

    static toRowProperty(objectKey: string): string {
        //convert objectKey to column_key
        return objectKey.replace(/([A-Z]+)/g, "_$1").replace(/^_/, "").toLowerCase();
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

    toRow(jsObject: any): Array<any> {
        let _arr = new Array();
        let _columns = [];
        let _values = [];

        for (let key of jsObject) {
            let _col = MysqlTable.toRowProperty(key);
            //only if this key/property of object is actualy a column (except  primary key)
        
            if (this.columns.indexOf(_col) !== -1) {

                _columns.push(_col);
                _values.push(jsObject[key]);

            }

        }

        _arr.push(_columns);
        _arr.push(_values);

        return _arr;

    }

    getPrimaryKeyValue(jsObject): string|number {
        var returnValue: string|number = 0;
        var primaryKeyObjectProperty = MysqlTable.toObjectProperty(this.primaryKey);
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

    putTablePropertyFrom(mysqlTableToSearch: string, parentObj: any): Promise<void> {
        let def = Promise.defer();
        let tableProperty = MysqlTable.toObjectProperty(mysqlTableToSearch);
        let tablePropertyObj = parentObj[tableProperty];

        for (let key of tablePropertyObj) { //or in
            let _val = tablePropertyObj[key];
            if (_val === EQUAL_TO_PROPERTY_SYMBOL) {
                tablePropertyObj[key] = parentObj[key];
            }
        }

        this.find(parentObj).then((results: any[]) => {
            parentObj[tableProperty] = results;
            def.resolve();
        });

        return <any>def.promise;
    }

    parseQueryResult(jsObject: any, result: any, tablesToSearch: string[]): Promise<any> {
        let def = Promise.defer();
        let _obj = {};
        let self = this;
        for (let key of result) {
            let propertyObjKey = MysqlTable.toObjectProperty(key);
            _obj[propertyObjKey] = result[key];
        }

        if (tablesToSearch.length === 0) {
            def.resolve(_obj);
        } else {
            let promisesList = [];

            [].forEach.call(tablesToSearch, (tableToSearch: string) => {
                let tableToSearchProp = MysqlTable.toObjectProperty(tableToSearch);

                _obj = jsObject[tableToSearchProp] = jsObject[tableToSearchProp];
                promisesList.push(self.putTablePropertyFrom(tableToSearch, _obj));

                Promise.all(promisesList).then(() => {
                    def.resolve(_obj);
                }).error(() => {
                    def.reject("Error when parsing the object from table.");
                });
            });

        }

        return def.promise;
    }

    find(jsObject: any, callback?: (_results: any[]) => any): Promise<any> {
        let def = Promise.defer();


        let colsToSearch = [];
        let tablesToSearch = [];
        let noDbProperties = [];
        let manySelectQuery = "";

        for (let objectKey of jsObject) {
            let colName = MysqlTable.toRowProperty(objectKey);

            if (this.columns.indexOf(colName) !== -1 || this.primaryKey === colName) {
                colsToSearch.push(colName + " = " + this.connection.escape(jsObject[objectKey]));
            } else {
                if (this.connection.table(colName) !== undefined) {
                    tablesToSearch.push(colName);
                } else {
                    noDbProperties.push(objectKey);
                }
            }
        }
        let whereParameterStr = "";

        if (colsToSearch.length > 0) {
            whereParameterStr = " WHERE " + colsToSearch.join(" AND ");
        }
        let _query = ("SELECT * FROM " + this.name + whereParameterStr);

        this.connection.query(_query, (err, results) => {
            if (err || !results) {
                def.reject(err);
            }

            let resultsPromises = [];

            [].forEach.call(results, (result) => {
                resultsPromises.push(this.parseQueryResult(jsObject, result, tablesToSearch));
            });

            Promise.all(resultsPromises).then((_objects: any[]) => {
                if (noDbProperties.length > 0) {
                    [].forEach.call(_objects, (theObj: any) => {

                        for (let pr = 0; pr < noDbProperties.length; pr++) {
                            theObj[noDbProperties[pr]] = jsObject[noDbProperties[pr]];
                        }
                    });
                }

                def.resolve(_objects);
            });

        });

        return def.promise;
    }

    findAll(callback?:(_results:any[])=>any): Promise<any> { return this.find({},callback); }

    save(jsObject: any, callback?: (_result: any) => any): Promise<any> {
        //sta arguments borw na perniounte ta values me tin seira, ton properties pou exei to model-jsObject 
        let def = Promise.defer();
        let primaryKeyValue = this.getPrimaryKeyValue(jsObject);
        
        //14-08-2015 always run toRow before save.  if (this.columns.length === 0 || this.values.length === 0) {
        let arr = this.toRow(jsObject);
        let objectColumns = arr[0]; // = columns , 1= values
        let objectValues = arr[1];
        //   }
    
        if (primaryKeyValue > 0) {
            //update
            var colummnsAndValuesStr = "";
            for (let i = 0; i < objectColumns.length; i++) {
                colummnsAndValuesStr += "," + objectColumns[i] + "=" + this.connection.escape(objectValues[i]);
            }
            colummnsAndValuesStr = colummnsAndValuesStr.substring(1);
            let _query = "UPDATE " + this.name + " SET " + colummnsAndValuesStr + " WHERE " + this.primaryKey + " =  " + primaryKeyValue;
            this.connection.query(_query, (err, result) => {
                if (err) {
                    console.dir(err);
                    def.reject(err);

                }
                this.connection.notice(this.name, _query, jsObject);
                def.resolve(jsObject);
                if (callback) {
                    callback(jsObject);  //an kai kanonika auto to kanei mono t
                }
            });

        } else {
            //create
            let _query = "INSERT INTO ?? (??) VALUES(?) ";
            this.connection.query(_query, (err, result) => {
                if (err) { console.dir(err); def.reject(err); }
                // jsObject[this.primaryKey] = result.insertId;

                var primaryKeyJsObjectProperty = MysqlTable.toObjectProperty(this.primaryKey);
                jsObject[primaryKeyJsObjectProperty] = result.insertId;
                primaryKeyValue = result.insertId;

                this.connection.notice(this.name, _query, jsObject);
                def.resolve(jsObject);
                if (callback) {
                    callback(jsObject);
                }
             

            }, [this.name, objectColumns, objectValues]);
        }
        return def.promise;
    }

    safeRemove(jsObject: any, callback?: (_result: any) => any): Promise<any> {
        let def = Promise.defer();

        let primaryKeyValue = this.getPrimaryKeyValue(jsObject);
        if (primaryKeyValue <= 0) {
            def.reject('Primary Key is missing!');
        }

        let _query = "DELETE FROM " + this.name + " WHERE " + this.primaryKey + " = " + primaryKeyValue;
        this.connection.query(_query, (err, result) => {
            if (err) {
                console.dir(err);
                def.reject(err);
            }
            jsObject.affectedRows = result.affectedRows;
            this.connection.notice(this.name, _query, jsObject);
            def.resolve(jsObject);
            if (callback) {
                callback(jsObject);  //an kai kanonika auto to kanei mono t
            }
        });

        return def.promise;
    }

    remove(jsObject: any, callback?: (_result: any) => any): Promise<any> {
        let def = Promise.defer();
        let primaryKeyValue = this.getPrimaryKeyValue(jsObject);
        if (!primaryKeyValue || primaryKeyValue <= 0) {
            let arr = this.toRow(jsObject);
            let objectValues = arr[1];
            let colummnsAndValues = [];
            for (let i = 0; i < colummnsAndValues.length; i++) {
                colummnsAndValues.push(colummnsAndValues[i] + "=" + this.connection.escape(objectValues[i]));
            }
            if (colummnsAndValues.length === 0) {
                def.reject('No criteria found in model! ');
            }

            let _query = "DELETE FROM " + this.name + " WHERE " + colummnsAndValues.join(' AND ');
            this.connection.query(_query, (err, result) => {
                if (err) {
                    console.dir(err);
                    def.reject(err);
                }
                jsObject.affectedRows = result.affectedRows;
                this.connection.notice(this.name, _query, jsObject);
                def.resolve(jsObject);
                if (callback) {
                    callback(jsObject);  //an kai kanonika auto to kanei mono t
                }
            });
        } else {
            return this.safeRemove(jsObject);
        }
        return def.promise;
    }

}

                                      
  