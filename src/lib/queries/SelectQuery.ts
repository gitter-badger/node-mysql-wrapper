import Helper from "../Helper";
import Table from "../Table";
import {SelectQueryRules} from "./SelectQueryRules";
import {ICriteriaParts} from "../CriteriaDivider";
import IQuery from"./IQuery";

import * as Promise from 'bluebird';

export var EQUAL_TO_PROPERTY_SYMBOL = '=';

class SelectQuery<T> implements IQuery<T> { // T for Table's result type.
   
    constructor(public _table: Table<T>) {

    }



    private parseQueryResult(result: any, criteria: ICriteriaParts): Promise<any> {
        return new Promise((resolve: (value: any) => void) => {
            let obj = this._table.objectFromRow(result);
            if (criteria.tables.length > 0) {
                let tableFindPromiseList = [];
                //tables to search
                criteria.tables.forEach((_tableProperty) => {
                    let table = this._table.connection.table(_tableProperty.tableName);
                    let tablePropertyName = Helper.toObjectProperty(_tableProperty.propertyName);
                    let criteriaJsObject = Helper.copyObject(criteria.rawCriteriaObject[tablePropertyName]);
                    Helper.forEachKey(criteriaJsObject, (propertyName) => {
                        if (criteriaJsObject[propertyName] === EQUAL_TO_PROPERTY_SYMBOL) {
                            criteriaJsObject[propertyName] = result[Helper.toRowProperty(propertyName)];
                        }
                    });
                    let tableFindPromise = table.find(criteriaJsObject);

                    tableFindPromise.then((childResults) => {
                        if (childResults.length === 1 &&
                            Helper.hasRules(criteriaJsObject) &&
                            (criteriaJsObject["tableRules"].limit !== undefined && criteriaJsObject["tableRules"].limit === 1) ||
                            (criteriaJsObject["tableRules"].limitEnd !== undefined && criteriaJsObject["tableRules"].limitEnd === 1)) {
                            //edw an vriskeis mono ena result ALLA kai o developer epsaxne mono gia ena result, tote min kaneis to property ws array.
                            obj[tablePropertyName] = this._table.objectFromRow(childResults[0]);

                        } else {
                            obj[tablePropertyName] = [];
                            childResults.forEach((childResult) => {
                                obj[tablePropertyName].push(this._table.objectFromRow(childResult));
                            });
                        }
                    });
                    tableFindPromiseList.push(tableFindPromise);

                });

                Promise.all(tableFindPromiseList).then(() => {
                    resolve(obj);
                });

            } else {
                resolve(obj);
            }

        });
    }

    /**
     * Executes the select and returns the Promise.
     */
    promise(rawCriteria: any, callback?: (_results: T[]) => any):  Promise<T[]> {
        return new Promise<T[]>((resolve, reject) => {
            //  if(!this._rules){
              
            //search BEFORE building the criteria, inside the criteria if tableRules property found.
            let queryRules: SelectQueryRules;
            if (rawCriteria["tableRules"] !== undefined) {

                queryRules = SelectQueryRules.fromRawObject(rawCriteria["tableRules"]);
                //edw den vazw .from gia na kanei full override ola ta tables rules.
            } else {
                queryRules = new SelectQueryRules().from(this._table.rules);
            }
            
           
            //  }
            
            var criteria = this._table.criteriaDivider.divide(rawCriteria);

            let query = "SELECT * FROM " + this._table.name + criteria.whereClause + queryRules.toString();

            this._table.connection.query(query, (error, results: any[]) => {
                if (error || !results) {
                    reject(error + ' Error. On find');
                }
                let parseQueryResultsPromises = [];

                results.forEach((result) => {
                    parseQueryResultsPromises.push(this.parseQueryResult(result, criteria)); //as table name

                });

                Promise.all(parseQueryResultsPromises).then((_objects: T[]) => {


                    if (callback !== undefined) {
                        callback(_objects);
                    }

                    resolve(_objects);
                });

            });
        });

    }

    /**
     * Exactly the same thing as promise().
     * Executes the select and returns the Promise.
    */
    execute(rawCriteria: any, callback?: (_results: T[]) => any): Promise<T[]> { 
          return this.promise(rawCriteria);
    }


    /*then<U>(onFulfill: (value: T[]) => U|Promise.Thenable<U>, onReject: (error: any) => Promise.Thenable<U>, onProgress?: (note: any) => any): Promise<U>;
    then(onFulfill: (value: any[]) => any|Promise.Thenable<any>): Promise<any>;
    then<U>(onFulfill: (value: T[]) => U|Promise.Thenable<U>, onReject?: (error: any) => U, onProgress?: (note: any) => any): Promise<U> {
        return this.promise().then(onFulfill, onReject, onProgress);
    }*/
}

/*
 5. EXPLAINATION :

 * .where(primaryKeyValue) | .where("key",value)
 * .join(joinedTable) <-- the foreign key here is the primary key of the parent(primary) table
 * .join (joinedTable,foreignKey)
 * .joinAs(joinedTable,storedToObjectAsPropertyName)  <-- the foreign key here is the primary key of the parent(primary) table
 * .joinAs(joinedTable,asPropertyName,foreignKey)
 *.table(joinedTable).join(childJoinedTable) <-- .table gets the joinedTable ( go to joinedTable and do...whatever follows (eg: .join ))

   5. Problems and solutions:

 * to 9ema einai oti isws 9elw na kanw kai where mesa sta join gt px: 9elw ola ta posts tou profile tou user pou dextike san receiver
 * ta opoia einai ~edw ti kanw? published===1.
 * to .table 9a epistrefei NEO SelectQueryWhere(extends SelectQuery), 9a epistrefei sto proigoumeno table me to .parent()
 * ara kapou mesa sto selectquerywhere na valw kai property _parent:SelectQueryWhere to opoio 9a benei apto .table() function.
 * kai otan 9a ginete build se criteria, 9a pigenei sto prwto parent  gt borei o developer na stamatisei mesa se upo .table()
 * giauto 9a exw dictionary to _parent<number,SelectQueryWhere> . to 0 9a einai to prwto kai oso pio va9ua pigenoume 9a anevenei o ari9mos
 * to prwto table 9a to vriskw me mia loopa me ton let i= ari9mo pou einai to parent+1 mexri na vrei to 0. tote 9a stamataei ekei
 * kai 9a epistrefei to prwtarxiko SelectQueryWhere.
 * mesa se auti ti loopa kapws na to kanw na pros9etei kai ta nea stoixeia (tou child table sto parent table) pou bikan
 * (edw exoume na kanoume mono me to kommati pou ksekinaei meta to where  kai teleiwnei sta rules(orderBy ktlp) )
 * me to where (ta alla einai se rules logika 9a doulevoun),  pws 9a to kanw enas god kserei...
 * h olh ipo9esi einai na kanw to criteria object etsi wste na ginete swsto to find, aliws 9a borousa na doulepsw kia to builder me tin mia
 * alla etsi dn 9a extiza ta child tou child raw criteria pou 9elei to .find() to opoio enoeite kaleitai apo to select query gia
 * na vriskei ta apotelesmata kai to opoio find kalei to select query, ginete kuklos gia na vriskei ola ta childs mesw
 * tou parseQueryResults (auta einai swsta kai doulevoun apsoga).
 * Wstoso, einai swsto na exw to selectquerywhere san extended tou selectquery? oso to skeftika, nai einai to pio swsto
 * gt edw mesa ftiaxnete to rawCriteriaObject pou 9a xrisimopoiisei to selectquery, an den uparxei idi rawcriteriaobject mesa tou.
 *
 * meta apo 10 lepta:
 * isws kanw new klasi ParentSelectQueryWhere to opoio 9a exei kai to parent:SelectQueryWhere
 *
 * kai isws na metanwmasw na valw ton kwdika gia to pws 9a ta pernei ta select query where, mesa sto criteria builder
 * i na kanw tin klasi apo SelectQueryWhere se SelectCriteriaBuilder, kai na allaksw to idi criteria builder se kati allo? 9a dw
 *
 * tin epomenh mera:
 * den 9a epistrefei tpt , ola 9a ginonte mesw string currentTable kai map me to parentObject<String,{}[]>.
 * o,ti kai na kanw omws dn 9a borei o xristis na vazei limit,orderby sta subtables, mono to where dioti
 * den einai etsi kataskevasmeno to structure tou criteria object, den to exw kanei akoma na pernei orderby ktlp...
 *     {
        yearsOld: 22,
        userInfos: {
             userId: '='
        },
        comments: {
            userId: '=',
            commentLikes: {
                //ektos an to kanw kapws etsi,to 9ema einai na min berdeuete gt an exei ena subtable rules stin db tote ti ginete?
                //na to kanw tableRules? queryRules, selectQueryRules? ?
                tableRules{
                    orderBy: "Something" ,//an einai keno tote 9a upo9etei to primary key autou tou table (commentLikes)
                    orderByDesc : "commentLikeId",
                    limit:10

                }
                commentId: '=',
                users: {
                    userId: '='
                }
            }
        }
    } ara 8a kanw override kai ta order by, limit ktlp
 */






export default SelectQuery;
