//LAST EDIT: 08/09/2015
var gulp = require("gulp");
var argv = require('yargs').argv;
var streamqueue = require('streamqueue');
var typescript = require("gulp-typescript");
var zip = require("gulp-zip"),
	pjson = require("./package.json");
//var concat = require("gulp-concat"); maybe for future

var tsProject = typescript.createProject("tsconfig.json"); //use of tscofnig for compiler's settings


gulp.task("src", function () {

	return gulp.src(["src/**/*.ts","src/**/**/*.ts"]) //lib, and lib/queries. //except lib.d.ts. Maybe for future use:  { base: './src/' }
		.pipe(typescript(tsProject))
		.pipe(gulp.dest("./compiled/"))
		.pipe(gulp.dest("./examples_javascript/node_modules/node-mysql-wrapper/compiled/"))
		.pipe(gulp.dest("./examples_typescript/node_modules/node-mysql-wrapper/compiled/"));
});

gulp.task("typings", function () {

	return gulp.src(["definitely_typed/**/*d.ts"])
		.pipe(gulp.dest("./compiled/typings/"))
		.pipe(gulp.dest("./examples_javascript/node_modules/node-mysql-wrapper/compiled/typings/"))
		.pipe(gulp.dest("./examples_typescript/node_modules/node-mysql-wrapper/compiled/typings/"));
});


/**
 * Generate a zip package of the application
 * use gulp zip --name "to onoma mesa se strings"
 */
gulp.task("zip", function () {
	var nameFromConsole = argv.name;
	if (nameFromConsole === undefined) {
		nameFromConsole = "";
	}
    var date = new Date();/*.toISOString().replace(/[^0-9]/g, '')*/
	var unorderedDate = date.toLocaleDateString().split("-");
	var dateStr = unorderedDate[2] + "-" +unorderedDate[1] + "-"+unorderedDate[0];//date.getDate() + "-"+date.getMonth()+"-"+date.getFullYear();
	
	var stream = streamqueue({ objectMode: true });

    stream.queue(
        gulp.src(
            [
                "./**",
				"!zip_releases/**",
				"!.git/**",
				"!./compiled/**",
				"!./node_modules/**",
				"!.ntvs_analysis.dat",
				"!./examples_javascript/node_modules/**",
				"!./examples_typescript/node_modules/node-mysql-wrapper/**"
            ],
            { base: "." })
		);

    // once preprocess ended, concat result into a real file
    return stream.done()
        .pipe(zip(pjson.name + " (" + dateStr + ")" + " [V" + pjson.version + " " + nameFromConsole + "]" + ".zip"))
        .pipe(gulp.dest("zip_releases/"));
});



gulp.task("watchSrc", function () {
	gulp.watch("src/**/*.ts", ['src'])
});

gulp.task("watchTypings", function () {
	gulp.watch("definitely_typed/**/*d.ts", ['typings'])
});

gulp.task("watchAll", ["watchSrc", "watchTypings"], function () {

});

gulp.task("default", ["src", "typings", "watchSrc", "watchTypings"], function () {

})