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
            console.dir(criteria);
            console.log(criteria["userId"]);
            console.log(criteria["comments"].getSelector());
            var obj = {};
            obj["username"] = "something for username";
            foundResults.push(obj);
            callback(foundResults);
        };
        return Database;
    })();
    MysqlDatabase.Database = Database;
    /// <reference path="lib.d.ts"/>
    var DataList = (function () {
        function DataList(selector) {
            this.selector = selector;
            Array.apply(this, arguments);
        }
        DataList.prototype.setSelector = function (selector) {
            this.selector = selector;
        };
        DataList.prototype.getSelector = function () {
            return this.selector;
        };
        return DataList;
    })();
    MysqlDatabase.DataList = DataList;
    var Table = (function () {
        function Table(name) {
            this.name = name;
        }
        return Table;
    })();
})(MysqlDatabase || (MysqlDatabase = {}));
//# sourceMappingURL=Database.js.map