var MysqlDatabase;
(function (MysqlDatabase) {
    var Tables = (function () {
        function Tables() {
        }
        return Tables;
    })();
    MysqlDatabase.Tables = Tables;
    var Database = (function () {
        function Database() {
            //  tables: <><Table> ;
            /* _tables : {
                 symbol. string;
             }*/
            //na vrw tin fais mou sta generics, peftw gia upno 3 iwra pige.
            // public tables: Array<T>;
            this.tables = new Tables();
        }
        Database.prototype.useTables = function () {
            var _this = this;
            var tablesToUse = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                tablesToUse[_i - 0] = arguments[_i];
            }
            tablesToUse.forEach(function (table) {
                //       this.tables.push(table);
                //  this._tables[symbol.for(table)] : Table;
                //   this._tables[table] = new Table(table);
                _this.tables[table] = new Table(table);
                // this.tables.push(new Table(_table));
            });
        };
        Database.prototype.ready = function (callback) {
            //edw o kwdikas gia psilo dynamic pre-compiled tables, 9a leitourgei mono an valw to useTables...estw kati einai k auto, aliws den ginete na doulevei to autocomplete :/
            callback();
        };
        /*
    
        function activator<T extends IActivatable>(type: { new(): T ;} ): T {
        return new type();
    }
    
        */
        Database.prototype.activator = function (type) {
            return new type();
        };
        //find<T>(criteria: { new (): T; }, callback: (results: Array<T>) => void): void { //promises future. <- auto einai gia na ftiaxnw new , me var obj:T = new criteria(); 9a boresw na to xrisimopoisw kia san deutero param 9a exw to criteria object, pou 9a borouse na einai :any.kai sta tables meta 9a to kanw me 2 params kai to prwto to type 9a benei aptin table class
        Database.prototype.find = function (criteria, callback) {
            var foundResults = new Array();
            /*     console.dir(criteria);
                 console.log(criteria["userId"]);
     
     
                 var obj: T = <T>{};
                 obj["username"] = "something for username";
     
                 obj["comments"] = new RowList< {}>(criteria["comments"].selector);
     
                 obj["comments"].items.push({ conent: "duskolo na doulepsei auto" });
                 obj["comments"].items.push({ conent: "kai omws...doulepse" });
                 */
            var obj = {};
            var i = 1;
            for (var key in criteria) {
                if (criteria[key] instanceof RelationshipArray) {
                    //  console.log("key: " + key + " is the relationshiparray");
                    var _relationshipArray = criteria[key];
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
                }
            }
            obj["username"] = "something for username";
            foundResults.push(obj);
            callback(foundResults);
        };
        return Database;
    })();
    MysqlDatabase.Database = Database;
    var RelationshipArray = (function () {
        function RelationshipArray(table) {
            this.list = {};
            this.length = 0;
            this.table = table;
        }
        RelationshipArray.prototype.getRelation = function (index) {
            return this.list[index];
        };
        RelationshipArray.prototype.add = function (obj) {
            this.list[obj.property] = obj;
            this.length++;
        };
        RelationshipArray.prototype.remove = function (index) {
            delete this.list[index];
            for (var i = index + 1; i < this.length; i++) {
                this.list[i - 1] = this.list[i];
                delete this.list[i];
            }
            this.length--;
        };
        RelationshipArray.prototype.forEach = function (callback) {
            for (var i = 0; i < this.length; i++) {
                callback(this.list[i]);
            }
        };
        return RelationshipArray;
    })();
    MysqlDatabase.RelationshipArray = RelationshipArray;
    function relationship(foreignKeyProperyColName, classType, isList) {
        if (isList === void 0) { isList = false; }
        return function (target, propertyKey) {
            if (target.relations === undefined) {
                target.relations = new RelationshipArray();
            }
            var relation = new Relationship(foreignKeyProperyColName, propertyKey, classType, isList); //classType.name for class name
            target.relations.add(relation);
        };
    }
    MysqlDatabase.relationship = relationship;
    var Relationship = (function () {
        function Relationship(key, property, classType, list) {
            this.key = key;
            this.property = property;
            this.classType = classType;
            this.list = list;
        }
        return Relationship;
    })();
    MysqlDatabase.Relationship = Relationship;
    var Row = (function () {
        function Row(genType, selector) {
            this.genericType = genType;
            this.selector = selector;
        }
        return Row;
    })();
    MysqlDatabase.Row = Row;
    //export type rowlist = <T>(x: T) => RowList<T>;
    var RowList = (function () {
        function RowList(genType, selector) {
            this.length = 0;
            this.genericType = genType;
            this.selector = selector;
        }
        RowList.prototype.getRow = function (index) {
            return this[index];
        };
        RowList.prototype.add = function (obj) {
            this[this.length] = obj;
            this.length++;
        };
        RowList.prototype.remove = function (index) {
            delete this[index];
            for (var i = index + 1; i < this.length; i++) {
                this[i - 1] = this[i];
                delete this[i];
            }
            this.length--;
        };
        RowList.prototype.forEach = function (callback) {
            for (var i = 0; i < this.length; i++) {
                callback(this[i]);
            }
        };
        return RowList;
    })();
    MysqlDatabase.RowList = RowList;
    var TableColumn = (function () {
        function TableColumn() {
        }
        return TableColumn;
    })();
    MysqlDatabase.TableColumn = TableColumn;
    var Table = (function () {
        function Table(name) {
            this.name = name;
        }
        return Table;
    })();
})(MysqlDatabase = exports.MysqlDatabase || (exports.MysqlDatabase = {}));
//# sourceMappingURL=MysqlDatabase.js.map