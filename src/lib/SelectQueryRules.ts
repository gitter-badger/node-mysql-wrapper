import MysqlUtil from "./MysqlUtil";


export class SelectQueryRules {
	public orderByClause: string = "";
	public groupByClause: string = "";
	public limitClause: string = "";


	static build(): SelectQueryRules;
	static build(parentRule?: SelectQueryRules): SelectQueryRules {
		let _rules = new SelectQueryRules();
		if (parentRule) {
			_rules.from(parentRule);
		}
		return _rules;
	}

	orderBy(columnKey: string, descending?: boolean): SelectQueryRules {
		if (!columnKey || (columnKey !== undefined && columnKey === "")) {
			this.orderByClause = "";
		} else {
			this.orderByClause = " ORDER BY " + MysqlUtil.toRowProperty(columnKey) + (descending ? " DESC " : "");
		}
		return this;
    }

	groupBy(columnKey: string): SelectQueryRules {
		if (!columnKey || (columnKey !== undefined && columnKey === "")) {
			this.groupByClause = "";
		} else {
			this.groupByClause = " GROUP BY " + columnKey;
		}

		return this;
	}

	limit(limitRowsOrStart: number, limitEnd?: number): SelectQueryRules {
		if (!limitRowsOrStart || (limitRowsOrStart !== undefined && limitRowsOrStart === 0)) {
			this.limitClause = ""
		} else {
			this.limitClause = " LIMIT " + limitRowsOrStart + (limitEnd !== undefined && limitEnd > limitRowsOrStart ? "," + limitEnd : "");

		}
		return this;
	}

	clearOrderBy(): SelectQueryRules {
		this.orderByClause = "";
		return this;
	}

	clearGroupBy(): SelectQueryRules {
		this.groupByClause = "";
		return this;
	}

	clearLimit(): SelectQueryRules {
		this.limitClause = "";
		return this;
	}

	clear(): SelectQueryRules {
		return this.clearOrderBy().clearGroupBy().clearLimit();
	}

	from(parentRule: SelectQueryRules): SelectQueryRules {
		if (this.orderByClause.length < 1) {
			this.orderByClause = parentRule.orderByClause;
		}
		if (this.groupByClause.length < 1) {
			this.groupByClause = parentRule.groupByClause;
		}
		if (this.limitClause.length < 1) {
			this.limitClause = parentRule.limitClause;
		}
		return this;
	}

    toString(): string {
		let afterWhere = "";
		//no group by and order by in the same query.	
		if (this.groupByClause.length > 1 && this.orderByClause.length > 1) {
			afterWhere = this.orderByClause;
		} else {
			afterWhere = this.orderByClause + this.groupByClause + this.limitClause;
		}

		return afterWhere;
	}


}
