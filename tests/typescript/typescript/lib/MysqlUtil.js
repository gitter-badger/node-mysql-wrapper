var MysqlUtil = (function () {
    function MysqlUtil() {
    }
    MysqlUtil.copyObject = function (object) {
        var objectCopy = {};
        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                objectCopy[key] = object[key];
            }
        }
        return objectCopy;
    };
    MysqlUtil.toObjectProperty = function (columnKey) {
        //convert column_key to objectKey
        return columnKey.replace(/(_.)/g, function (x) { return x[1].toUpperCase(); });
    };
    MysqlUtil.toRowProperty = function (objectKey) {
        //convert objectKey to column_key
        return objectKey.replace(/([A-Z]+)/g, "_$1").replace(/^_/, "").toLowerCase();
    };
    MysqlUtil.forEachValue = function (map, callback) {
        var result;
        for (var id in map) {
            if ((result = callback(map[id])))
                break;
        }
        return result;
    };
    MysqlUtil.forEachKey = function (map, callback) {
        var result;
        for (var id in map) {
            if ((result = callback(id)))
                break;
        }
        return result;
    };
    return MysqlUtil;
})();
exports.default = MysqlUtil;
//# sourceMappingURL=MysqlUtil.js.map