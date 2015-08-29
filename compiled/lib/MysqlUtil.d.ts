export interface Map<T> {
    [index: string]: T;
}
declare class MysqlUtil {
    constructor();
    static copyObject<T>(object: T): T;
    static toObjectProperty(columnKey: string): string;
    static toRowProperty(objectKey: string): string;
    static forEachValue<T, U>(map: Map<T>, callback: (value: T) => U): U;
    static forEachKey<T, U>(map: Map<T>, callback: (key: string) => U): U;
}
export default MysqlUtil;
