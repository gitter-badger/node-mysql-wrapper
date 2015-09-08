var DeleteQuery = (function () {
    function DeleteQuery(_table) {
        this._table = _table;
    }
    DeleteQuery.prototype.execute = function (criteriaOrID, callback) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var primaryKeyValue = _this._table.getPrimaryKeyValue(criteriaOrID);
            if (!primaryKeyValue || primaryKeyValue <= 0) {
                var arr = _this._table.getRowAsArray(criteriaOrID);
                var objectValues = arr[1];
                var colummnsAndValues = [];
                for (var i = 0; i < colummnsAndValues.length; i++) {
                    colummnsAndValues.push(colummnsAndValues[i] + "=" + _this._table.connection.escape(objectValues[i]));
                }
                if (colummnsAndValues.length === 0) {
                    reject('No criteria found in model! ');
                }
                var _query = "DELETE FROM " + _this._table.name + " WHERE " + colummnsAndValues.join(' AND ');
                _this._table.connection.query(_query, function (err, result) {
                    if (err) {
                        reject(err);
                    }
                    var _objReturned = { affectedRows: result.affectedRows, table: _this._table.name };
                    _this._table.connection.notice(_this._table.name, _query, [_objReturned]);
                    resolve(_objReturned);
                    if (callback) {
                        callback(_objReturned);
                    }
                });
            }
            else {
                var _query = "DELETE FROM " + _this._table.name + " WHERE " + _this._table.primaryKey + " = " + criteriaOrID;
                _this._table.connection.query(_query, function (err, result) {
                    if (err) {
                        reject(err);
                    }
                    var _objReturned = { affectedRows: result.affectedRows, table: _this._table.name };
                    _this._table.connection.notice(_this._table.name, _query, [_objReturned]);
                    resolve(_objReturned);
                    if (callback) {
                        callback(_objReturned);
                    }
                });
            }
        });
    };
    return DeleteQuery;
})();
exports.default = DeleteQuery;
