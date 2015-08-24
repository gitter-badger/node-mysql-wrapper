class MysqlUtil {
    constructor() { }

    static copyObject<T>(object: T): T {
        var objectCopy = <T> {};

        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                objectCopy[key] = object[key];
            }
        }

        return objectCopy;
    }

    static toObjectProperty(columnKey): string {
        //convert column_key to objectKey
        return columnKey.replace(/(_.)/g, (x) => { return x[1].toUpperCase() });
    }

    static toRowProperty(objectKey: string): string {
        //convert objectKey to column_key
        return objectKey.replace(/([A-Z]+)/g, "_$1").replace(/^_/, "").toLowerCase();
    }


}

export default MysqlUtil;