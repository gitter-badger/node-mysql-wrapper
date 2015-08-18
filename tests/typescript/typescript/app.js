/// <reference path="MysqlDatabase.ts"/>
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
//import dataListModule = MysqlDatabase.RowList;
//import mysqlModule = require("./MysqlDatabase");
var mysqlModule = require("./MysqlDatabase");
var RowList = mysqlModule.MysqlDatabase.RowList;
var Row = mysqlModule.MysqlDatabase.Row;
var relationship = mysqlModule.MysqlDatabase.relationship; //decorator
var db = new mysqlModule.MysqlDatabase.Database();
db.useTables("users", "comments");
//db.tables["users"].getName()
var usersNameTable = db.tables["users"].name;
console.log("users table: " + usersNameTable);
//@Table("users")
var User = (function () {
    /*  public get aproperty() {
          return this._aproperty;
      }
      public set aproperty(arg: string) {
          this._aproperty = arg;
      }
      */
    function User() {
        //this.info.
        this.userId = 0;
        this.username = "";
        this.comments = new RowList(Comment, "userId");
        this.info = new Row(Info, "userId");
    }
    __decorate([
        relationship("userId", Number, true)
    ], User.prototype, "_aproperty");
    return User;
})();
function log(target, propertyKey, descriptor) {
    var originalMethod = descriptor.value; // save a reference to the original method
    // NOTE: Do not use arrow syntax here. Use a function expression in 
    // order to use the correct value of `this` in this method (see notes below)
    //console.log("propertyKey: " + propertyKey + " \n Target:\n");
    // console.dir(target);
    descriptor.value = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        //  console.log("The method args are: " + JSON.stringify(args)); // pre
        var result = originalMethod.apply(this, args); // run and store the result
        //   console.log("The return value is: " + result);               // post
        return result; // return the result of the original method
    };
    return descriptor;
}
var Comment = (function () {
    function Comment() {
        this.commentId = 0; //prepei na ta kanw init ka9e gia na pernei ta properties swsta lol
        this.content = ""; //prepei na ta kanw init ka9e fora gia na pernei swsta ta properties, i edw i sto constructor...
        this.commentFromUserId = 0;
    }
    return Comment;
})();
var Info = (function () {
    function Info() {
        this.infoId = 0;
        this.userId = 0;
        this.hometown = "";
    }
    Info.prototype.testMethod = function (arg) {
        return "Message -- " + arg;
    };
    Object.defineProperty(Info.prototype, "testMethod",
        __decorate([
            log
        ], Info.prototype, "testMethod", Object.getOwnPropertyDescriptor(Info.prototype, "testMethod")));
    return Info;
})();
var criteria = new User();
//console.log(criteria["relations"]);
//console.dir(criteria);
//console.dir(Reflect.ownKeys(criteria));
criteria.userId = 18;
db.find(criteria, function (results) {
    //    new Info().testMethod('just testing :) ');
    /* console.log(results[0].username);
     for (var i = 0; i < results[0].comments.length; i++) {
         var comment = results[0].comments[i];
         console.log(comment.content + " with comment id: " + comment.commentId);
     }
 
     console.log("===============after remove");
     results[0].comments.remove(2);
 
     console.dir(results[0].comments);
 
     results[0].comments.forEach((comment) => {
         console.log(comment.content);
     });
   
     /*  for (var i = 0; i < results[0].comments.length; i++) {
         comment = results[0].comments[i];
         console.log(comment.content + " with comment id: " + comment.commentId);
     }
     */
});
//# sourceMappingURL=app.js.map