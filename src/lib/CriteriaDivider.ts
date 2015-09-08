import Table from "./Table";
import Helper from "./Helper";

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
        let colsToSearch = [];
        let tablesToSearch: TableToSearchPart[] = [];
        let noDbProperties = [];
        let whereParameterStr = "";

        Helper.forEachKey(rawCriteriaObject, (objectKey) => {

            let colName = Helper.toRowProperty(objectKey);

            if (this._table.columns.indexOf(colName) !== -1 || this._table.primaryKey === colName) {
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
                let realTableName = prop["tableRules"]["table"];
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
