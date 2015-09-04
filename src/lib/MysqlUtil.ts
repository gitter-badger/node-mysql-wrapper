export interface Map<T> {
    [index: string]: T;
}

class MysqlUtil {
    constructor() { }

    static copyObject<T>(object: T): T {
        let objectCopy = <T> {};
        for (let key in object) {
            if (object.hasOwnProperty(key)) {
                objectCopy[key] = object[key];
            }
        }

        return objectCopy;
    }

    static toObjectProperty(columnKey: string): string {
        //convert column_key to objectKey
        return columnKey.replace(/(_.)/g, (x) => { return x[1].toUpperCase() });
    }

    static toRowProperty(objectKey: string): string {
        //convert objectKey to column_key
        return objectKey.replace(/([A-Z]+)/g, "_$1").replace(/^_/, "").toLowerCase();
    }


    static forEachValue<T, U>(map: Map<T>, callback: (value: T) => U): U {
        let result: U;
        for (let id in map) {
            if ((result = callback(map[id]))) break;
        }
        return result;
    }

    static forEachKey<T, U>(map: Map<T>, callback: (key: string) => U): U {
        let result: U;
        for (let id in map) {
            if ((result = callback(id))) break;
        }
        return result;
    }

    static isFunction(functionToCheck) {
        let getType = {};
        return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
    }


}

export default MysqlUtil;