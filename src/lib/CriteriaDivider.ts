import Table from "./Table";
import Helper from "./Helper";
import {TABLE_RULES_PROPERTY} from "./queries/SelectQueryRules";

export type TableToSearchPart = { tableName: string, propertyName: string };

export interface ICriteriaParts {
    rawCriteriaObject: any;
    tables: TableToSearchPart[];
    noDatabaseProperties: string[];
    whereClause: string;

}

export class CriteriaParts implements ICriteriaParts {
    constructor(public rawCriteriaObject: any, public tables: TableToSearchPart[], public noDatabaseProperties: string[], public whereClause: string) {

    }
}

export class CriteriaDivider<T> {
    private _table: Table<T>;

    constructor(table: Table<T>) {
        this._table = table;
    }

    divide(rawCriteriaObject: any): CriteriaParts {
        let colsToSearch: string[] = [];
        let tablesToSearch: TableToSearchPart[] = [];
        let noDbProperties: string[] = [];
        let whereParameterStr: string = "";
        Helper.forEachKey(rawCriteriaObject, (objectKey) => {

            let colName = Helper.toRowProperty(objectKey);
            let exceptColumns: string[] = [];

            //auto paei edw kai oxi pio katw gt exei sxesi me auto to table, enw pio katw otan kanw forEach einai gia na dw ta joinedTables.
           
            if (objectKey === TABLE_RULES_PROPERTY && rawCriteriaObject[objectKey]["except"] !== undefined) {
                //has rules 
                exceptColumns = rawCriteriaObject[objectKey]["except"];
                //ta except columns  gia na min ginete select * ginete mesa sto SelectQuery vasi twn tableRules kai oxi tou criteriaDivider .   
            }
            //auto edw MONO,apla dn afinei na boun sta .where columns pou exoun ginei except gia na min uparksoun mysql query errors.
            if ((this._table.columns.indexOf(colName) !== -1 && exceptColumns.indexOf(colName) !== -1) || this._table.primaryKey === colName) {
                colsToSearch.push(colName + " = " + this._table.connection.escape(rawCriteriaObject[objectKey]));
            } else {
                if (this._table.connection.table(colName) !== undefined) {
                    tablesToSearch.push({ tableName: colName, propertyName: colName });
                } else {
                    noDbProperties.push(objectKey);
                }
            }
        });
        
        //check for table-as(join as ) property tables from no db properties
        
        noDbProperties.forEach(key=> {
            let prop = rawCriteriaObject[key];
            if (Helper.hasRules(prop)) {
                let realTableName = prop[TABLE_RULES_PROPERTY]["table"];
                if (realTableName !== undefined) {
                    tablesToSearch.push({ tableName: Helper.toRowProperty(realTableName), propertyName: key });
                    //maybe I need to remove this key from noDbProperties in the future

                }
            }
        });

        if (colsToSearch.length > 0) {
            whereParameterStr = " WHERE " + colsToSearch.join(" AND ");
        }

        return new CriteriaParts(rawCriteriaObject, tablesToSearch, noDbProperties, whereParameterStr);
    }
}
