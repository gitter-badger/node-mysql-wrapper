import Helper from "../Helper";

export var TABLE_RULES_PROPERTY = "tableRules";

export type RawRules = {
	table: string, //AUTO UPOLOGIZETE APO TO CRITERIA BUILDER, DEN BENEI STO .TOSTRING, TO VAZW EDW GIA ENAN MONO LOGO, GIA NA BORW NA KANW TO SELECTQUERYBUILDER. 
	except: string[], //except columns.
	begin: string,
	orderBy: string,
	orderByDesc: string,
	groupBy: string,
	limit: number, // limit = limitStart  =0 and limitEnd = limit.
	limitStart: number,
	limitEnd: number,
	end: string

};

export class SelectQueryRules {
	private lastPropertyClauseName: string;

	public manuallyEndClause: string = "";
	public manuallyBeginClause: string = "";
	public orderByColumn: string = "";
	public orderByDescColumn: string = "";
	public groupByColumn: string = "";
	public limitStart: number = 0;
	public limitEnd: number = 0;
	public tableName: string = ""; //auto den benei oute sto last, oute sto from.
	public exceptColumns: string[] = []; //oute auto benei sto from.

	static build(): SelectQueryRules;
	static build(parentRule?: SelectQueryRules): SelectQueryRules {
		let _rules = new SelectQueryRules();
		if (parentRule) {
			_rules.from(parentRule);
		}
		return _rules;
	}


    private last(propertyClauseName: string) {
		this.lastPropertyClauseName = propertyClauseName;
	}

	table(realTableName: string): SelectQueryRules {
		if (realTableName === undefined || realTableName === "") {
			this.tableName = "";
		} else {
			this.tableName = realTableName;
		}

		return this;
	}

	except(...columns: string[]): SelectQueryRules {
		if (columns !== undefined && columns.length > 0) {
			this.exceptColumns = columns;
		} else {
			this.exceptColumns = [];
		}
		return this;
	}

	exclude(...columns: string[]): SelectQueryRules {
		return this.except(columns.toString());
	}

	orderBy(columnKey: string, descending?: boolean): SelectQueryRules {
		if (!columnKey || (columnKey !== undefined && columnKey === "")) {

			this.orderByColumn = "";
		} else {
			if (descending) {
				this.orderByDescColumn = columnKey;
				this.last("orderByDescColumn");
			} else {
				this.orderByColumn = columnKey;
				this.last("orderByColumn");
			}
			//this.orderByClause = " ORDER BY " + Helper.toRowProperty(columnKey) + (descending ? " DESC " : "");
			
		}


		return this;
    }

	groupBy(columnKey: string): SelectQueryRules {
		if (!columnKey || (columnKey !== undefined && columnKey === "")) {
			this.groupByColumn = "";
		} else {
			//this.groupByClause = " GROUP BY " + columnKey;
			this.groupByColumn = columnKey;
			this.last("groupByColumn");
		}
		return this;
	}

	limit(limitRowsOrStart: number, limitEnd?: number): SelectQueryRules {
		if (limitEnd === undefined && limitRowsOrStart === undefined) {
			this.limitStart = 0;
			this.limitEnd = 0;
		} else {
			//this.limitClause = " LIMIT " + limitRowsOrStart + (limitEnd !== undefined && limitEnd > limitRowsOrStart ? "," + limitEnd : "");
			if (limitEnd !== undefined && limitEnd > limitRowsOrStart) {
				this.limitStart = limitRowsOrStart;
				this.limitEnd = limitEnd;

			} else if (limitEnd === undefined) {
				this.limitStart = 0;
				this.limitEnd = limitRowsOrStart;

			}
			this.last("limitEnd");
			//this.limitNumber = limitRowsOrStart;
			
			
		}

		return this;
	}

	appendToBegin(manualAfterWhereString: string): SelectQueryRules {
		if (manualAfterWhereString !== undefined && manualAfterWhereString.length > 0) {
			this.manuallyBeginClause += manualAfterWhereString;
			this.last("manuallyBeginClause");
		}
		return this;
	}

	appendToEnd(manualAfterWhereString: string): SelectQueryRules {
		if (manualAfterWhereString !== undefined && manualAfterWhereString.length > 0) {
			this.manuallyEndClause += manualAfterWhereString;
			this.last("manuallyEndClause");
		}

		return this;
	}

	append(appendToCurrent: string): SelectQueryRules {
		if (appendToCurrent !== undefined && appendToCurrent.length > 0) {
			if (this.lastPropertyClauseName !== undefined && this.lastPropertyClauseName.length > 1) {
				this[this.lastPropertyClauseName] += appendToCurrent;
			} else {
				this.manuallyBeginClause = appendToCurrent;
			}
		}

		return this;
	}

	clearOrderBy(): SelectQueryRules {
		//here I could check for lastproperty and remove or reverse to the back
		//but I dont want to do it I think is useless, and maybe problems occurs if this happens.
		this.orderByColumn = "";
		this.orderByDescColumn = "";
		return this;
	}

	clearGroupBy(): SelectQueryRules {
		this.groupByColumn = "";
		return this;
	}

	clearLimit(): SelectQueryRules {
		this.limitStart = 0;
		this.limitEnd = 0;
		return this;
	}

	clearEndClause(): SelectQueryRules {
		this.manuallyEndClause = "";
		return this;
	}

	clearBeginClause(): SelectQueryRules {
		this.manuallyBeginClause = "";
		return this;
	}

	clear(): SelectQueryRules {
		this.last("");
		this.tableName = "";
		this.exceptColumns = [];
		return this.clearBeginClause().clearOrderBy().clearGroupBy().clearLimit().clearEndClause();
	}

	from(parentRule: SelectQueryRules): SelectQueryRules {
		if (this.manuallyBeginClause.length < 1) {
			this.manuallyBeginClause = parentRule.manuallyBeginClause;
		}
		if (this.orderByColumn.length < 1) {
			this.orderByColumn = parentRule.orderByColumn;
		}
		if (this.orderByDescColumn.length < 1) {
			this.orderByDescColumn = parentRule.orderByDescColumn;
		}
		if (this.groupByColumn.length < 1) {
			this.groupByColumn = parentRule.groupByColumn;
		}
		if (this.limitStart === 0 || this.limitEnd === 0) {
			this.limitStart = parentRule.limitStart;
			this.limitEnd = parentRule.limitEnd;
		}

		if (this.manuallyEndClause.length < 1) {
			this.manuallyEndClause = parentRule.manuallyEndClause;
		}
		return this;
	}

	isEmpty(): boolean {
		if (this.exceptColumns.length < 1 && this.tableName.length < 1 && this.manuallyBeginClause.length < 1 && this.orderByColumn.length < 1 && this.orderByDescColumn.length < 1 && this.groupByColumn.length < 1
			&& this.limitStart === 0 && this.limitEnd === 0 && this.manuallyEndClause.length < 1) {
			return true;
		} else {
			return false;
		}
	}

	toString(): string {
		return SelectQueryRules.toString(this);
	}

	toRawObject(): RawRules {
		return SelectQueryRules.toRawObject(this);
	}

	static toString(rules: SelectQueryRules): string {
		let afterWhere = "";
		//no group by and order by in the same query.	
		let _orderbyClause = "";
		let _groupByClause = rules.groupByColumn.length > 1 ? " GROUP BY " + Helper.toRowProperty(rules.groupByColumn) + " " : "";
		let _limitClause = rules.limitEnd > 0 ? " LIMIT " + rules.limitStart + ", " + rules.limitEnd : "";

		if (rules.orderByColumn.length > 1) {
			_orderbyClause = " ORDER BY " + Helper.toRowProperty(rules.orderByColumn) + " ";
		} else if (rules.orderByDescColumn.length > 1) {
			_orderbyClause = " ORDER BY " + Helper.toRowProperty(rules.orderByDescColumn) + " DESC ";
		}

		if (rules.groupByColumn.length > 1 && (rules.orderByColumn.length > 1 || rules.orderByDescColumn.length > 1)) {
			afterWhere = _orderbyClause;
			_groupByClause = "";
		} else {

			afterWhere = _orderbyClause + _groupByClause + _limitClause;
		}

		return rules.manuallyBeginClause + afterWhere + rules.manuallyEndClause;
	}
	
	//ftiaxnei to tableRules object mesa sta criteria pou benei.
	static toRawObject(rules: SelectQueryRules): RawRules {
		if (rules.isEmpty()) {
			return undefined;
		}

		let obj: RawRules;
		if (rules.tableName.length > 1) {
			obj.table = rules.tableName;
		}
		if (rules.exceptColumns.length > 1) {
			obj.except = rules.exceptColumns;
		}
		if (rules.manuallyBeginClause.length > 1) {
			obj.begin = rules.manuallyBeginClause;
		}
		if (rules.manuallyEndClause.length > 1) {
			obj.end = rules.manuallyEndClause;
		}

		if (rules.orderByColumn.length > 1) {
			obj.orderBy = rules.orderByColumn;
		}
		if (rules.orderByDescColumn.length > 1) {
			obj.orderByDesc = rules.orderByDescColumn;
		}

		if (rules.groupByColumn.length > 1) {
			obj.groupBy = rules.groupByColumn;
		}

		if (rules.limitEnd > 0) {
			obj.limitStart = rules.limitStart;
			obj.limitEnd = rules.limitEnd;
		}

		return obj;
	}

	static fromRawObject(obj: RawRules): SelectQueryRules {
		let rules = new SelectQueryRules();

		if (obj.table !== undefined && obj.table.length > 1) {
			rules.table(obj.table);
		}

		rules.appendToBegin(obj.begin);

		if (obj.orderBy !== undefined && obj.orderBy.length > 1) {
			rules.orderBy(obj.orderBy, false);
		} else if (obj.orderByDesc !== undefined && obj.orderByDesc.length > 1) {
			rules.orderBy(obj.orderByDesc, true);
		}

		if (obj.limit > 0) {

			if (obj.limitEnd > 0) {
				obj.limitStart = obj.limit;

			} else {
				obj.limitStart = 0;

				obj.limitEnd = obj.limit;
			}
		}
		if (obj.except !== undefined) {
			rules.except(obj.except.toString());
		}

		rules.limit(obj.limitStart, obj.limitEnd);
		rules.groupBy(obj.groupBy);
		rules.appendToEnd(obj.end);

		return rules;
	}

}
