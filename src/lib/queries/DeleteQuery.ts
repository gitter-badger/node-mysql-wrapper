import Helper from "../Helper";
import Table from "../Table";
import IQuery from"./IQuery";
//den kserw gt dn xreiazete to import * from "bluebird"  edw kai kapou allou mipws epidi kanw import to ./table ?

export type DeleteAnswer = {
    affectedRows: number;
    table: string;
};

class DeleteQuery<T> implements IQuery<T>{

    constructor(public _table: Table<T>) {

    }

    execute(criteriaOrID: any | number | string, callback?: (_result: DeleteAnswer) => any): Promise<DeleteAnswer> {
        return new Promise<DeleteAnswer>((resolve, reject) => {
            let primaryKeyValue = this._table.getPrimaryKeyValue(criteriaOrID);

            if (!primaryKeyValue || primaryKeyValue <= 0) { 
                //REMOVE BY WHERE 
                let arr = this._table.getRowAsArray(criteriaOrID);
                let objectValues = arr[1];
                let colummnsAndValues = [];
                for (let i = 0; i < colummnsAndValues.length; i++) {
                    colummnsAndValues.push(colummnsAndValues[i] + "=" + this._table.connection.escape(objectValues[i]));
                }
                if (colummnsAndValues.length === 0) {
                    reject('No criteria found in model! ');
                }

                let _query = "DELETE FROM " + this._table.name + " WHERE " + colummnsAndValues.join(' AND ');
                this._table.connection.query(_query, (err, result) => {
                    if (err) {
                        //console.dir(err);
                        reject(err);
                    }
                    let _objReturned = { affectedRows: result.affectedRows, table: this._table.name };

                    this._table.connection.notice(this._table.name, _query, [_objReturned]);
                    resolve(_objReturned);
                    if (callback) {
                        callback(_objReturned);  //an kai kanonika auto to kanei mono t
                    }
                });
            } else {
                //SAVE REMOVE BY ID
                let _query = "DELETE FROM " + this._table.name + " WHERE " + this._table.primaryKey + " = " + criteriaOrID;
                this._table.connection.query(_query, (err, result) => {
                    if (err) {
                        // console.dir(err);
                        reject(err);
                    }
                    let _objReturned = { affectedRows: result.affectedRows, table: this._table.name };

                    this._table.connection.notice(this._table.name, _query, [_objReturned]);
                    resolve(_objReturned);
                    if (callback) {
                        callback(_objReturned); //an kai kanonika auto to kanei mono t
                    }
                });
            }
        });
    }
}



export default DeleteQuery;