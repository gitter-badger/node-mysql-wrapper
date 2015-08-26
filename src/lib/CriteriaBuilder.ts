import MysqlTable from "./MysqlTable";
import MysqlUtil from "./MysqlUtil";

export interface ICriteria {
    rawCriteriaObject: any;
    tables: string[];
    noDatabaseProperties: string[];
    whereClause: string;
}

export class Criteria implements ICriteria {
    constructor(public rawCriteriaObject: any, public tables: string[], public noDatabaseProperties: string[], public whereClause: string) {

    }
}

export class CriteriaBuilder {
    private _table: MysqlTable;

    constructor(table: MysqlTable) {
        this._table = table;
    }


    build(rawCriteriaObject: any): Criteria {
        let colsToSearch = [];
        let tablesToSearch = [];
        let noDbProperties = [];
        let whereParameterStr = "";

        MysqlUtil.forEachKey(rawCriteriaObject, (objectKey) => {

            let colName = MysqlUtil.toRowProperty(objectKey);

            if (this._table.columns.indexOf(colName) !== -1 || this._table.primaryKey === colName) {
                colsToSearch.push(colName + " = " + this._table.connection.escape(rawCriteriaObject[objectKey]));
            } else {
                if (this._table.connection.table(colName) !== undefined) {
                    tablesToSearch.push(colName);
                } else {
                    noDbProperties.push(objectKey);
                }
            }
        });


        if (colsToSearch.length > 0) {
            whereParameterStr = " WHERE " + colsToSearch.join(" AND ");
        }

        return new Criteria(rawCriteriaObject, tablesToSearch, noDbProperties, whereParameterStr);
    }
}
