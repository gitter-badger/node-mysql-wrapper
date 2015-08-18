/// <reference path="MysqlDatabase.ts"/>

//import dataListModule = MysqlDatabase.RowList;
//import mysqlModule = require("./MysqlDatabase");
import * as mysqlModule from "./MysqlDatabase";
import RowList = mysqlModule.MysqlDatabase.RowList;
import Row = mysqlModule.MysqlDatabase.Row;
import row = mysqlModule.MysqlDatabase.row;
import relationship = mysqlModule.MysqlDatabase.relationship;      //decorator
import RelationshipArray = mysqlModule.MysqlDatabase.RelationshipArray;
var db = new mysqlModule.MysqlDatabase.Database();

db.useTables("users", "comments");



//db.tables["users"].getName()
var usersNameTable = db.tables["users"].name;

console.log("users table: " + usersNameTable);



//@Table("users")

class User {
    //  userId = new TableColumn<Number>();
    // username = new TableColumn<String>();
    // @relationship("commentFromUserId", true)
    //   theComments= new  Array<Comment>();
                 
    @relationship("userId", Number, true)
    public _aproperty: Array<Comment>;
    userId: number = 0;
    username = "";

    comments = new RowList<Comment>(Comment, "userId");
    info = new Row<Info>(Info, "userId");

 

   
    /*  public get aproperty() {
          return this._aproperty;
      }
      public set aproperty(arg: string) {
          this._aproperty = arg;
      }
      */
    constructor() {
        //this.info.
       
    }


}


function log(target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) {
    var originalMethod = descriptor.value; // save a reference to the original method

    // NOTE: Do not use arrow syntax here. Use a function expression in 
    // order to use the correct value of `this` in this method (see notes below)
    //console.log("propertyKey: " + propertyKey + " \n Target:\n");
    // console.dir(target);
    descriptor.value = function (...args: any[]) {
        //  console.log("The method args are: " + JSON.stringify(args)); // pre
        var result = originalMethod.apply(this, args);               // run and store the result
        //   console.log("The return value is: " + result);               // post
        return result;                                               // return the result of the original method
    };

    return descriptor;
}

class Comment {
    commentId: number = 0; //prepei na ta kanw init ka9e gia na pernei ta properties swsta lol
    content = ""; //prepei na ta kanw init ka9e fora gia na pernei swsta ta properties, i edw i sto constructor...
    commentFromUserId: number = 0;

}
class Info {
    @log
    testMethod(arg: string) {
        return "Message -- " + arg;
    }

    infoId = 0;
    userId = 0;
    hometown = "";
}

var criteria: User = new User();
//console.log(criteria["relations"]);
//console.dir(criteria);
//console.dir(Reflect.ownKeys(criteria));

criteria.userId = 18;

db.find(criteria, (results) => {
                              
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