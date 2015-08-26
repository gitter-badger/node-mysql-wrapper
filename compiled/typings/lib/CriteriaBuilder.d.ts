import MysqlTable from "./MysqlTable";
export interface ICriteria {
    rawCriteriaObject: any;
    tables: string[];
    noDatabaseProperties: string[];
    whereClause: string;
}
export declare class Criteria implements ICriteria {
    rawCriteriaObject: any;
    tables: string[];
    noDatabaseProperties: string[];
    whereClause: string;
    constructor(rawCriteriaObject: any, tables: string[], noDatabaseProperties: string[], whereClause: string);
}
export declare class CriteriaBuilder {
    private _table;
    constructor(table: MysqlTable);
    build(rawCriteriaObject: any): Criteria;
}
