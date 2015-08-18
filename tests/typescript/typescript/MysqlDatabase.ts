export module MysqlDatabase {
    export type row = Row<any>;

    export class Tables {
        [name: string]: Table;
    }

    export class Database {
        //  tables: <><Table> ;
        /* _tables : {
             symbol. string;
         }*/

        //na vrw tin fais mou sta generics, peftw gia upno 3 iwra pige.
        // public tables: Array<T>;
 
    
        public tables: Tables = new Tables();

        useTables(...tablesToUse: string[]): void {
            tablesToUse.forEach((table) => {
                //       this.tables.push(table);
                //  this._tables[symbol.for(table)] : Table;
                //   this._tables[table] = new Table(table);
                this.tables[table] = new Table(table);
                // this.tables.push(new Table(_table));
            });
        }

        ready(callback: () => void) {
            //edw o kwdikas gia psilo dynamic pre-compiled tables, 9a leitourgei mono an valw to useTables...estw kati einai k auto, aliws den ginete na doulevei to autocomplete :/
        

            callback();
        }


        /*
    
        function activator<T extends IActivatable>(type: { new(): T ;} ): T {
        return new type();
    }
    
        */

        activator<T>(type: { new (): T; }): T {
            return new type();
        }
        
        //find<T>(criteria: { new (): T; }, callback: (results: Array<T>) => void): void { //promises future. <- auto einai gia na ftiaxnw new , me var obj:T = new criteria(); 9a boresw na to xrisimopoisw kia san deutero param 9a exw to criteria object, pou 9a borouse na einai :any.kai sta tables meta 9a to kanw me 2 params kai to prwto to type 9a benei aptin table class
        find<T>(criteria: T, callback: (results: Array<T>) => void): void { //promises future.
            var foundResults: Array<T> = new Array<T>();
            /*     console.dir(criteria);
                 console.log(criteria["userId"]);
     
     
                 var obj: T = <T>{};
                 obj["username"] = "something for username";
     
                 obj["comments"] = new RowList< {}>(criteria["comments"].selector);
     
                 obj["comments"].items.push({ conent: "duskolo na doulepsei auto" });
                 obj["comments"].items.push({ conent: "kai omws...doulepse" });
                 */
            var obj: T = <T>{};



            var i = 1;

            for (var key in criteria) {

                if (criteria[key] instanceof RelationshipArray) {
                    //  console.log("key: " + key + " is the relationshiparray");
                    var _relationshipArray: RelationshipArray = criteria[key];
                //    console.dir(_relationshipArray.list["_aproperty"]);       working
                    console.dir(_relationshipArray.list);

                }

                if (criteria[key] instanceof RowList) {
                    console.log(key + " is datalist!");
                    obj[key] = criteria[key];
                    //                    obj[key].items.push({ content: "kai omws...doulepse" });

                    console.log('type of data list inside is: ' + criteria[key].genericType.name);

                    //   var instance = Object.create(obj[key].genericType);
                    // instance.constructor.apply(instance, null);
                    //    var instance = Object.create(criteria[key].genericType);
                    //criteria[key].genericType.constructor.apply(criteria[key].genericType, null);// instance.constructor.apply(criteria[key].genericType, null);


                    // console.dir(criteria[key].genericType);
                    //  var instance = Object..create(criteria[key].genericType.name);
                    //   criteria[key].genericType.constructor.apply(criteria[key].genericType, null);

                    console.log(' but can we get properties? ');
                    var thetype = criteria[key].genericType;
                    var _class = new criteria[key].genericType();
                    _class.constructor.apply(_class);

                    //  var newInstance = Object.create(  criteria[key].genericType.prototype);
                    //   newInstance.constructor.apply(newInstance, null);
                    //   console.log(_class.hasOwnProperty("content"));
                   
                    for (var key2 in _class) {
                        console.log(key2);
                        obj[key].add({ commentId: i, content: "something for comment?" + i });
                        obj[key].add({ commentId: (i + 1), content: "something for comment? " + (i + 1) });
                        i += 2;
                    }
                    // for (var key2 in criteria[key].genericType) { //auto doulevei an exw idi properties sto datalist constructor mesa sto _genericType
                    //     console.log(key2); //edw pernei to content px an exoume valei kati stin lista...
                    //  }
                    /* } else if (criteria[key] instanceof (TableColumn) ) {
                    console.log(key + " is column");*/
                }
            }

            obj["username"] = "something for username";

            foundResults.push(obj);

            callback(foundResults);
        }



    }

    /*  export class RowList<T> {
          private _selector: string;
     
          private _items = new Array<T>();
          private _genericType: { new (): T; };
     
          constructor(selector: string, genType: { new (): T; }) {
              this._selector = selector;
              //  this._genericType = new genType();
              this._genericType = genType; // new genType();
              //this._genericType["content"] = "a testing";
              // console.dir(this._genericType);
              //   this._items = items;
              
          }
     
          get items(): Array<T> {
              return this._items;
          }
     
          set items(items: Array<T>) {
              this._items = items;
          }
     
          set selector(selector: string) {
              this._selector = selector;
          }
     
          get selector(): string {
              return this._selector;
          }
     
          get genericType(): { new (): T; } {
              return this._genericType;
          }
     }
    */

    export interface IRelationshipDic {
        [name: string]: Relationship;    //mapped by  the property's name.
    }
    export class RelationshipArray {
        list: IRelationshipDic = {};
        length: number = 0;
        table: string;

        constructor(table?: string) {
            this.table = table;

        }

        getRelation(index: number): Relationship {
            return this.list[index];
        }

        add(obj: Relationship): void {
            this.list[obj.property] = obj;
            this.length++;
        }

        remove(index: number) {        //den kserw kan an doulevie me index=string auto alla 9a doume...an kai dn xreizete edw sigekrimena 
            delete this.list[index];
            for (var i = index + 1; i < this.length; i++) {
                this.list[i - 1] = this.list[i];
                delete this.list[i];
            }

            this.length--;
        }

        forEach(callback: (obj: Relationship) => void) {
            for (var i = 0; i < this.length; i++) {
                callback(this.list[i]);
            }
        }




    }


    export function relationship(foreignKeyProperyColName: string, classType: { new (): any; }, isList: boolean = false) {

        return function (target: any, propertyKey: string) {

            if (target.relations === undefined) {
                target.relations = new RelationshipArray();
            }
            var relation: Relationship = new Relationship(foreignKeyProperyColName, propertyKey, classType, isList);     //classType.name for class name
            target.relations.add(relation);

        };
    }
    export class Relationship {
        key: string;
        property: string;
        classType: any;
        list: boolean;

        constructor(key: string, property: string, classType?: any, list?: boolean) {
            this.key = key;
            this.property = property;
            this.classType = classType;
            this.list = list;
        }
        //for decorators: 
   

    }

    export class Row<T> {
        genericType: { new (): T; };
        selector: string;
        constructor(genType?: { new (): T; }, selector?: string) {
            this.genericType = genType;
            this.selector = selector;

        }
    }

    //export type rowlist = <T>(x: T) => RowList<T>;
    export class RowList<T> {
        genericType: { new (): T; };
        [index: number]: T;
        selector: string;
        length: number = 0;

        constructor(genType?: { new (): T; }, selector?: string) {
            this.genericType = genType;
            this.selector = selector;

        }

        getRow(index: number): T {
            return this[index];
        }

        add(obj: T): void {
            this[this.length] = obj;
            this.length++;
        }

        remove(index: number) {
            delete this[index];
            for (var i = index + 1; i < this.length; i++) {
                this[i - 1] = this[i];
                delete this[i];
            }

            this.length--;
        }

        forEach(callback: (obj: T) => void) {
            for (var i = 0; i < this.length; i++) {
                callback(this[i]);
            }
        }
    }

    export class TableColumn<T> {
    }

    interface ITable {
        name: string;
    }

    class Table implements ITable {
        public name: string;
        constructor(name?: string) {
            this.name = name;
        }

    }

}
